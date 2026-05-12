jest.mock('../../middlewares/AuthMiddleware.js');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import pedidoRoutes from '../../routes/pedidoRoutes.js';
import '../../models/Restaurante.js';
import '../../models/Categoria.js';
import '../../models/Prato.js';
import '../../models/AdicionalGrupo.js';
import '../../models/AdicionalOpcao.js';
import '../../models/Pedido.js';
import '../../models/Usuario.js';
import Restaurante from '../../models/Restaurante.js';
import Prato from '../../models/Prato.js';
import AdicionalGrupo from '../../models/AdicionalGrupo.js';
import AdicionalOpcao from '../../models/AdicionalOpcao.js';
import Pedido from '../../models/Pedido.js';
import Usuario from '../../models/Usuario.js';
import Notificacao from '../../models/Notificacao.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);
let app;
let mongoServer;
let donoId;
let clienteId;
let outroUsuarioId;
let restauranteId;
let prato;
let grupo;
let opcao;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;
const seedDocumentos = {
    usuarios: [],
    restaurantes: [],
    pratos: [],
    grupos: [],
    opcoes: []
};
const testDocumentos = {
    pedidos: [],
    notificacoes: []
};


function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

function asAutenticado() {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = clienteId;
        next();
    });
}

function autenticarComo(userId) {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = userId;
        next();
    });
}

function pedidoBase(extra = {}) {
    return {
        cliente_id: clienteId,
        restaurante_id: restauranteId,
        status: 'criado',
        itens: [
            {
                prato_id: prato._id,
                prato_nome: prato.nome,
                preco_unitario: prato.preco,
                quantidade: 1,
                adicionais: []
            }
        ],
        totais: { subtotal: 10, taxa_entrega: 5, total: 15 },
        historico_status: [{ status: 'criado', data: new Date() }],
        ...extra
    };
}

async function criarUsuario(nome, extra = {}, track = false) {
    const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const usuario = await Usuario.create({
        nome,
        email: `${slug}-${nextId('mail')}@test.local`,
        senha: 'teste123',
        ...extra,
    });
    if (track) seedDocumentos.usuarios.push(usuario._id);
    return usuario._id;
}

async function criarRestaurante(nome, donoId, extra = {}, track = false) {
    const restaurante = await Restaurante.create({
        nome,
        cnpj: `${Math.random().toString().slice(2, 14)}`,
        dono_id: donoId,
        ...extra,
    });
    if (track) seedDocumentos.restaurantes.push(restaurante._id);
    return restaurante._id;
}

async function criarPrato(restauranteId, extra = {}, track = false) {
    const pratoCriado = await Prato.create({
        restaurante_id: restauranteId,
        nome: nextId('Prato'),
        preco: 10,
        descricao: 'Prato de teste',
        secao: 'Principais',
        ...extra,
    });
    if (track) seedDocumentos.pratos.push(pratoCriado._id);
    return pratoCriado;
}
async function criarGrupo(restauranteId, extra = {}, track = false) {
    const grupoCriado = await AdicionalGrupo.create({
        restaurante_id: restauranteId,
        nome: nextId('Grupo'),
        tipo: 'adicional',
        obrigatorio: true,
        min: 1,
        max: 1,
        ativo: true,
        ...extra,
    });
    if (track) seedDocumentos.grupos.push(grupoCriado._id);
    return grupoCriado;
}

async function criarOpcao(grupoId, extra = {}, track = false) {
    const opcaoCriada = await AdicionalOpcao.create({
        grupo_id: grupoId,
        nome: nextId('Opcao'),
        preco: 3,
        ativo: true,
        ...extra,
    });
    if (track) seedDocumentos.opcoes.push(opcaoCriada._id);
    return opcaoCriada;
}

beforeAll(async () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use('/api', pedidoRoutes);
    app.use(errorHandler);

    donoId = await criarUsuario('Dono Restaurante', {}, true);
    clienteId = await criarUsuario('Cliente Pedido', {}, true);
    outroUsuarioId = await criarUsuario('Outro Cliente Pedido', {}, true);
    restauranteId = await criarRestaurante('Restaurante Pedido', donoId, {
        status: 'aberto',
        taxa_entrega: 5
    }, true);

    prato = await criarPrato(restauranteId, {}, true);
    grupo = await criarGrupo(restauranteId, {}, true);
    opcao = await criarOpcao(grupo._id, {}, true);
    await Prato.findByIdAndUpdate(prato._id, { $addToSet: { adicionais_grupo_ids: grupo._id } });

    asAutenticado();
}, 30000);

afterEach(async () => {
    for (const [modelName, ids] of Object.entries(testDocumentos)) {
        if (ids.length === 0) continue;
        const model = {
            pedidos: Pedido,
            notificacoes: Notificacao
        }[modelName];
        if (model) {
            await model.deleteMany({ _id: { $in: ids } }).catch(() => {});
        }
        ids.length = 0;
    }
    asAutenticado();
});

afterAll(async () => {
    for (const [modelName, ids] of Object.entries(seedDocumentos)) {
        if (ids.length === 0) continue;
        const model = {
            usuarios: Usuario,
            restaurantes: Restaurante,
            pratos: Prato,
            grupos: AdicionalGrupo,
            opcoes: AdicionalOpcao
        }[modelName];
        if (model) {
            await model.deleteMany({ _id: { $in: ids } }).catch(() => {});
        }
    }

    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }

    if (console.warn.mockRestore) {
        console.warn.mockRestore();
    }
    if (console.error.mockRestore) {
        console.error.mockRestore();
    }
    if (console.log.mockRestore) {
        console.log.mockRestore();
    }
});
describe('pedidoRoutes', () => {
    it('GET /api/pedidos/meus retorna nenhum pedido quando não há histórico', async () => {
        const res = await request(app).get('/api/pedidos/meus');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Nenhum pedido encontrado.');
        expect(res.body.data).toBeDefined();
        expect(res.body.data).toEqual(expect.any(Object));
    });

    it('GET /api/pedidos/meus aplica filtros e retorna pedidos encontrados', async () => {
        const pedido = await Pedido.create(pedidoBase());
        testDocumentos.pedidos.push(pedido._id);

        const res = await request(app)
            .get('/api/pedidos/meus?status=criado&data_inicio=2020-01-01&data_fim=2030-12-31&page=1&limite=5');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('1 pedido(s) encontrado(s).');
        expect(res.body.data.docs[0]._id).toBe(pedido._id.toString());
    });

    it('GET /api/pedidos/restaurante/:restauranteId com filtro inválido retorna mensagem de filtro', async () => {
        autenticarComo(donoId);
        const res = await request(app).get(`/api/pedidos/restaurante/${restauranteId}?status=criado`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Nenhum pedido encontrado com os filtros informados.');
    });

    it('GET /api/pedidos/restaurante/:restauranteId retorna pedidos encontrados', async () => {
        const pedido = await Pedido.create(pedidoBase());
        testDocumentos.pedidos.push(pedido._id);

        autenticarComo(donoId);
        const res = await request(app)
            .get(`/api/pedidos/restaurante/${restauranteId}?status=criado&data_inicio=2020-01-01&data_fim=2030-12-31`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('1 pedido(s) encontrado(s).');
        expect(res.body.data.docs[0]._id).toBe(pedido._id.toString());
    });
        it('POST /api/pedidos cria pedido e recalcula valores de preços e frete', async () => {
        const payload = {
            restaurante_id: restauranteId.toString(),
            itens: [
                {
                    prato_id: prato._id.toString(),
                    quantidade: 1,
                    adicionais: [
                        {
                            opcao_id: opcao._id.toString(),
                            quantidade: 1
                        }
                    ]
                }
            ]
        };

        const res = await request(app).post('/api/pedidos').send(payload);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Pedido criado com sucesso.');
        expect(res.body.data).toMatchObject({
            status: 'criado',
            restaurante_id: restauranteId.toString(),
            itens: [
                expect.objectContaining({
                    prato_nome: prato.nome,
                    preco_unitario: prato.preco,
                    quantidade: 1,
                    adicionais: [
                        expect.objectContaining({
                            opcao_nome: opcao.nome,
                            preco_unitario: opcao.preco,
                            quantidade: 1
                        })
                    ]
                })
            ]
        });
        expect(res.body.data.totais.subtotal).toBe(13);
        expect(res.body.data.totais.taxa_entrega).toBe(5);
        expect(res.body.data.totais.total).toBe(18);

        testDocumentos.pedidos.push(res.body.data._id);

        const notificacao = await Notificacao.findOne({ pedido_id: res.body.data._id });
        expect(notificacao).not.toBeNull();
        expect(notificacao.tipo).toBe('pedido_confirmado');
        testDocumentos.notificacoes.push(notificacao._id);
    });

    it('POST /api/pedidos com corpo vazio retorna erro de validação', async () => {
        const res = await request(app).post('/api/pedidos').send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('O corpo da requisição é obrigatório para criar um pedido.');
        expect(res.body.errors).toEqual([
            expect.objectContaining({ path: 'body', message: 'O corpo da requisição não pode ser vazio.' })
        ]);
    });

    it('POST /api/pedidos rejeita restaurante fechado', async () => {
        const restauranteFechadoId = await criarRestaurante('Restaurante Fechado Pedido', donoId, {
            status: 'fechado',
        }, true);
        const pratoFechado = await criarPrato(restauranteFechadoId, { status: 'ativo' }, true);

        const res = await request(app).post('/api/pedidos').send({
            restaurante_id: restauranteFechadoId.toString(),
            itens: [{ prato_id: pratoFechado._id.toString(), quantidade: 1 }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('aberto');
    });

    it('POST /api/pedidos rejeita prato de outro restaurante', async () => {
        const outroRestauranteId = await criarRestaurante('Restaurante Outro Pedido', donoId, {
            status: 'aberto',
        }, true);
        const pratoOutro = await criarPrato(outroRestauranteId, { status: 'ativo' }, true);

        const res = await request(app).post('/api/pedidos').send({
            restaurante_id: restauranteId.toString(),
            itens: [{ prato_id: pratoOutro._id.toString(), quantidade: 1 }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('pertence');
    });

    it('POST /api/pedidos rejeita prato inativo', async () => {
        const pratoInativo = await criarPrato(restauranteId, { status: 'inativo' }, true);

        const res = await request(app).post('/api/pedidos').send({
            restaurante_id: restauranteId.toString(),
            itens: [{ prato_id: pratoInativo._id.toString(), quantidade: 1 }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('dispon');
    });

    it('POST /api/pedidos exige adicional obrigatorio do prato', async () => {
        const grupoAvulso = await criarGrupo(restauranteId, { obrigatorio: false }, true);
        const opcaoAvulsa = await criarOpcao(grupoAvulso._id, {}, true);

        const res = await request(app).post('/api/pedidos').send({
            restaurante_id: restauranteId.toString(),
            itens: [{
                prato_id: prato._id.toString(),
                quantidade: 1,
                adicionais: [{ opcao_id: opcaoAvulsa._id.toString(), quantidade: 1 }],
            }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('obrigat');
    });

    it('POST /api/pedidos rejeita adicional abaixo do minimo do grupo', async () => {
        const pratoComGrupo = await criarPrato(restauranteId, { status: 'ativo' }, true);
        const grupoMinimo = await criarGrupo(restauranteId, { min: 2, max: 3 }, true);
        const opcaoMinimo = await criarOpcao(grupoMinimo._id, {}, true);
        await Prato.findByIdAndUpdate(pratoComGrupo._id, { $addToSet: { adicionais_grupo_ids: grupoMinimo._id } });

        const res = await request(app).post('/api/pedidos').send({
            restaurante_id: restauranteId.toString(),
            itens: [{
                prato_id: pratoComGrupo._id.toString(),
                quantidade: 1,
                adicionais: [{ opcao_id: opcaoMinimo._id.toString(), quantidade: 1 }],
            }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('selecionadas');
    });

    it('POST /api/pedidos rejeita adicional acima do maximo do grupo', async () => {
        const res = await request(app).post('/api/pedidos').send({
            restaurante_id: restauranteId.toString(),
            itens: [{
                prato_id: prato._id.toString(),
                quantidade: 1,
                adicionais: [{ opcao_id: opcao._id.toString(), quantidade: 2 }],
            }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('permite');
    });
    it('PATCH /api/pedidos/:id/status atualiza pedido para em_preparo quando feito pelo dono', async () => {
        const pedido = await Pedido.create(pedidoBase());
        testDocumentos.pedidos.push(pedido._id);

        autenticarComo(donoId);
        const res = await request(app)
            .patch(`/api/pedidos/${pedido._id.toString()}/status`)
            .send({ status: 'em_preparo' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Status do pedido atualizado com sucesso.');
        expect(res.body.data.status).toBe('em_preparo');
        expect(res.body.data.historico_status).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: 'criado' }),
                expect.objectContaining({ status: 'em_preparo' })
            ])
        );

        const notificacao = await Notificacao.findOne({ pedido_id: pedido._id, tipo: 'em_preparo' });
        expect(notificacao).not.toBeNull();
        expect(notificacao.titulo).toBe('Pedido em preparo');
        testDocumentos.notificacoes.push(notificacao._id);
    });

    it('PATCH /api/pedidos/:id/status com corpo vazio retorna erro de validaÃ§Ã£o', async () => {
        const pedido = await Pedido.create(pedidoBase());
        testDocumentos.pedidos.push(pedido._id);

        const res = await request(app)
            .patch(`/api/pedidos/${pedido._id.toString()}/status`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Informe o novo status do pedido.');
    });

    it('PATCH /api/pedidos/:id/status nao cancela pedido entregue', async () => {
        const pedido = await Pedido.create(pedidoBase({ status: 'entregue' }));
        testDocumentos.pedidos.push(pedido._id);

        const res = await request(app)
            .patch(`/api/pedidos/${pedido._id.toString()}/status`)
            .send({ status: 'cancelado' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('entregue');
    });

    it('PATCH /api/pedidos/:id/status rejeita cancelamento por usuario sem relacao com o pedido', async () => {
        const pedido = await Pedido.create(pedidoBase());
        testDocumentos.pedidos.push(pedido._id);

        autenticarComo(outroUsuarioId);
        const res = await request(app)
            .patch(`/api/pedidos/${pedido._id.toString()}/status`)
            .send({ status: 'cancelado' });

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('cancelar');
    });

    it('PATCH /api/pedidos/:id/status rejeita transicao fora do fluxo', async () => {
        const pedido = await Pedido.create(pedidoBase());
        testDocumentos.pedidos.push(pedido._id);

        autenticarComo(donoId);
        const res = await request(app)
            .patch(`/api/pedidos/${pedido._id.toString()}/status`)
            .send({ status: 'entregue' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('inv');
    });
});
