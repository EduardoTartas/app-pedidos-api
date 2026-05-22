jest.mock('../../middlewares/AuthMiddleware.js');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import avaliacaoRoutes from '../../routes/avaliacaoRoute.js';
import AvaliacaoController from '../../controllers/AvaliacaoController.js';
import AvaliacaoRepository from '../../repository/AvaliacaoRepository.js';
import Avaliacao from '../../models/Avaliacao.js';
import '../../models/Categoria.js';
import Notificacao from '../../models/Notificacao.js';
import Usuario from '../../models/Usuario.js';
import Restaurante from '../../models/Restaurante.js';
import Pedido from '../../models/Pedido.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let restauranteId;
let clienteId;
let pedidoId;
let usuarioAuthId;

let warnSpy;
let errorSpy;
let logSpy;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempAvaliacoes = [];
const tempNotificacoes = [];
const tempPedidos = [];
const tempRestaurantes = [];
const tempUsuarios = [];

function asAutenticado() {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = usuarioAuthId;
        next();
    });
}

function autenticarComo(userId) {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = userId;
        next();
    });
}

function autenticarComoUmaVez(userId) {
    AuthMiddleware.mockImplementationOnce((req, res, next) => {
        req.user_id = userId;
        next();
    });
}

function asNaoAutenticado() {
    AuthMiddleware.mockImplementationOnce((req, res) => {
        res.status(401).json({
            error: true,
            code: 401,
            message: 'Não autorizado. Faça login para continuar.',
            data: null,
            errors: [],
        });
    });
}

async function criarUsuario(nome) {
    const usuario = await Usuario.create({
        nome,
        email: `${nome.toLowerCase()}_${RUN_ID}@test.local`,
        senha: 'teste123',
    });
    tempUsuarios.push(usuario._id);
    return usuario._id;
}

async function criarRestaurante(nome) {
    const donoId = await criarUsuario('Dono Restaurante');
    const restaurante = await Restaurante.create({
        nome,
        cnpj: `${Math.random().toString().slice(2, 14)}`,
        dono_id: donoId,
        endereco: { rua: 'Rua Teste', numero: 123, cidade: 'Teste', estado: 'TO' },
    });
    tempRestaurantes.push(restaurante._id);
    return restaurante._id;
}

async function criarPedido(restauranteId, clienteId, extra = {}) {
    const pedido = await Pedido.create({
        restaurante_id: restauranteId,
        cliente_id: clienteId,
        status: 'entregue',
        itens: [
            {
                prato_id: new ObjectId(),
                prato_nome: 'Prato Teste',
                quantidade: 1,
                preco_unitario: 50,
            },
        ],
        totais: {
            subtotal: 50,
            taxa_entrega: 0,
            total: 50,
        },
        ...extra,
    });
    tempPedidos.push(pedido._id);
    return pedido._id;
}

function payloadAvaliacao(pedidoId, extra = {}) {
    return {
        pedido_id: pedidoId,
        nota: 5,
        descricao: `Avaliação E2E ${RUN_ID}`,
        ...extra,
    };
}

beforeAll(async () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api', avaliacaoRoutes);
    app.use(errorHandler);

    usuarioAuthId = await criarUsuario('Usuario Auth Avaliacao');
    clienteId = await criarUsuario('Cliente Avaliacao');
    restauranteId = await criarRestaurante(`Restaurante Avaliacao ${RUN_ID}`);
    pedidoId = await criarPedido(restauranteId, clienteId);

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempAvaliacoes.length > 0) {
        await Avaliacao.deleteMany({ _id: { $in: tempAvaliacoes } }).catch(() => {});
        tempAvaliacoes.length = 0;
    }

    if (tempNotificacoes.length > 0) {
        await Notificacao.deleteMany({ _id: { $in: tempNotificacoes } }).catch(() => {});
        tempNotificacoes.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempAvaliacoes.length > 0) {
        await Avaliacao.deleteMany({ _id: { $in: tempAvaliacoes } }).catch(() => {});
    }

    if (tempNotificacoes.length > 0) {
        await Notificacao.deleteMany({ _id: { $in: tempNotificacoes } }).catch(() => {});
    }

    if (tempPedidos.length > 0) {
        await Pedido.deleteMany({ _id: { $in: tempPedidos } }).catch(() => {});
    }

    if (tempRestaurantes.length > 0) {
        await Restaurante.deleteMany({ _id: { $in: tempRestaurantes } }).catch(() => {});
    }

    if (tempUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: tempUsuarios } }).catch(() => {});
    }

    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }

    warnSpy?.mockRestore();
    errorSpy?.mockRestore();
    logSpy?.mockRestore();
}, 30000);

beforeEach(() => {
    asAutenticado();
});

describe('GET /avaliacoes/restaurante/:restauranteId', () => {
    it('lista avaliações de um restaurante existente → 200', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao 2');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);

        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId, { nota: 4 }));

        expect(res.status).toBe(201);
        tempAvaliacoes.push(res.body.data._id);

        const listRes = await request(app).get(`/api/avaliacoes/restaurante/${restauranteId}`);

        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.body.data.docs)).toBe(true);
        expect(listRes.body.data).toHaveProperty('totalDocs');
        expect(listRes.body.data).toHaveProperty('page');
        expect(listRes.body.data).toHaveProperty('limit');
        expect(listRes.body.data.docs[0].nota).toBe(4);
        expect(listRes.body.data.docs[0].cliente_id.nome).toBe('Cliente Avaliacao 2');
    });

    it('retorna estrutura paginada com valores padrão → 200', async () => {
        const res = await request(app).get(`/api/avaliacoes/restaurante/${restauranteId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
    });

    it('respeitacustomizações de paginação page=2&limite=5 → 200', async () => {
        const res = await request(app).get(`/api/avaliacoes/restaurante/${restauranteId}?page=2&limite=5`);

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.limit).toBe(5);
    });

    it('restauranteId inválido → 422', async () => {
        const res = await request(app).get(`/api/avaliacoes/restaurante/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('restaurante inexistente retorna lista vazia → 200', async () => {
        const res = await request(app).get(`/api/avaliacoes/restaurante/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });

    it('rota pública não requer autenticação → 200', async () => {
        const res = await request(app).get(`/api/avaliacoes/restaurante/${restauranteId}`);

        expect(res.status).toBe(200);
    });
});

describe('AvaliacaoController - ramos internos', () => {
    it('usa docs.length quando totalDocs nao existe', async () => {
        const controller = new AvaliacaoController();
        controller.service = {
            listarPorRestaurante: jest.fn().mockResolvedValue({ docs: [{ _id: 'avaliacao-1' }] }),
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await controller.listarPorRestaurante({
            params: { restauranteId: NOT_FOUND_OBJECT_ID },
            query: {},
        }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('1'),
        }));
    });
});

describe('AvaliacaoRepository - ramos internos', () => {
    function modelComFindById(resultado) {
        const populateRestaurante = jest.fn().mockResolvedValue(resultado);
        const populateCliente = jest.fn(() => ({ populate: populateRestaurante }));

        return {
            findById: jest.fn(() => ({ populate: populateCliente })),
        };
    }

    it('buscarPorID retorna avaliacao populada', async () => {
        const avaliacao = { _id: 'avaliacao-1' };
        const repository = new AvaliacaoRepository({
            AvaliacaoModel: modelComFindById(avaliacao),
        });

        await expect(repository.buscarPorID(NOT_FOUND_OBJECT_ID))
            .resolves
            .toBe(avaliacao);
    });

    it('buscarPorID retorna 404 quando nao encontra avaliacao', async () => {
        const repository = new AvaliacaoRepository({
            AvaliacaoModel: modelComFindById(null),
        });

        await expect(repository.buscarPorID(NOT_FOUND_OBJECT_ID))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });

    it('calcula media convertendo restauranteId string para ObjectId', async () => {
        const aggregate = jest.fn().mockResolvedValue([{ media: 4.26 }]);
        const repository = new AvaliacaoRepository({
            AvaliacaoModel: { aggregate },
        });

        const media = await repository.calcularMediaRestaurante(NOT_FOUND_OBJECT_ID);

        expect(media).toBe(4.3);
        expect(aggregate.mock.calls[0][0][0].$match.restaurante_id)
            .toBeInstanceOf(mongoose.Types.ObjectId);
    });
});

describe('POST /avaliacoes', () => {
    it('cria avaliação com payload válido mínimo → 201', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Create');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send({
                pedido_id: novoPedidoId,
                nota: 5,
            });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.nota).toBe(5);
        expect(res.body.data.pedido_id).toBe(novoPedidoId.toString());
        expect(res.body.data.cliente_id).toBe(novoClienteId.toString());
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());
        expect(res.body.data.descricao).toBe('');

        tempAvaliacoes.push(res.body.data._id);
        const pedidoAtualizado = await Pedido.findById(novoPedidoId);
        expect(String(pedidoAtualizado.avaliacao_id)).toBe(res.body.data._id);
    });

    it('cria avaliação com descricao opcional → 201', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Descricao');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId, {
                descricao: 'Ótimo atendimento!',
                nota: 5,
            }));

        expect(res.status).toBe(201);
        expect(res.body.data.descricao).toBe('Ótimo atendimento!');

        tempAvaliacoes.push(res.body.data._id);
        const restauranteAtualizado = await Restaurante.findById(restauranteId);
        expect(restauranteAtualizado.avaliacao_media).toBe(5);

        const notificacao = await Notificacao.findOne({ pedido_id: novoPedidoId });
        expect(notificacao).not.toBeNull();
        expect(String(notificacao.usuario_id)).toBe(String(restauranteAtualizado.dono_id));
        expect(notificacao.tipo).toBe('avaliacao');
        tempNotificacoes.push(notificacao._id);
    });

    it('nota abaixo do mínimo (0) → 422', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Nota Min');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId, { nota: 0 }));

        expect(res.status).toBe(400);
    });

    it('nota acima do máximo (6) → 422', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Nota Max');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId, { nota: 6 }));

        expect(res.status).toBe(400);
    });

    it('nota não inteira → 422', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Nota Float');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId, { nota: 3.5 }));

        expect(res.status).toBe(400);
    });

    it('descricao acima de 500 caracteres → 422', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Desc Long');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId, {
                descricao: 'A'.repeat(501),
            }));

        expect(res.status).toBe(400);
    });

    it('pedido_id ausente → 422', async () => {
        const res = await request(app)
            .post('/api/avaliacoes')
            .send({ nota: 5 });

        expect(res.status).toBe(400);
    });

    it('nota ausente → 422', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao Sem Nota');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send({ pedido_id: novoPedidoId });

        expect(res.status).toBe(400);
    });

    it('pedido_id inválido → 422', async () => {
        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(INVALID_OBJECT_ID));

        expect(res.status).toBe(400);
    });

    it('sem autenticação → 401', async () => {
        const novoClienteId = await criarUsuario('Cliente Avaliacao NoAuth');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);

        asNaoAutenticado();

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId));

        expect(res.status).toBe(401);
    });

    it('tentar avaliar pedido que não é seu → 403', async () => {
        const outroClienteId = await criarUsuario('Cliente Outro');
        const seuPedidoId = await criarPedido(restauranteId, outroClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(seuPedidoId));

        expect(res.status).toBe(403);
    });

    it('tentar avaliar pedido não entregue → 400', async () => {
        const novoClienteId = await criarUsuario('Cliente Nao Entregue');
        const pedidoNaoEntregueId = await criarPedido(restauranteId, novoClienteId, {
            status: 'criado',
        });
        autenticarComoUmaVez(novoClienteId);

        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(pedidoNaoEntregueId));

        expect(res.status).toBe(400);
    });

    it('tentar avaliar pedido já avaliado → 409', async () => {
        const novoClienteId = await criarUsuario('Cliente Ja Avaliado');
        const novoPedidoId = await criarPedido(restauranteId, novoClienteId);

        autenticarComo(novoClienteId);

        const res1 = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId));

        expect(res1.status).toBe(201);
        tempAvaliacoes.push(res1.body.data._id);
        const notificacao = await Notificacao.findOne({ pedido_id: novoPedidoId });
        if (notificacao) {
            tempNotificacoes.push(notificacao._id);
        }

        const res2 = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(novoPedidoId));

        expect(res2.status).toBe(409);
    });

    it('pedido_id inexistente → 404', async () => {
        const res = await request(app)
            .post('/api/avaliacoes')
            .send(payloadAvaliacao(NOT_FOUND_OBJECT_ID));

        expect(res.status).toBe(404);
    });
});
