jest.mock('../../middlewares/AuthMiddleware.js');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import notificacaoRoutes from '../../routes/notificacaoRoutes.js';
import NotificacaoController from '../../controllers/NotificacaoController.js';
import NotificacaoService from '../../service/NotificacaoService.js';
import NotificacaoRepository from '../../repository/NotificacaoRepository.js';
import Notificacao from '../../models/Notificacao.js';
import Usuario from '../../models/Usuario.js';
import { NotificacaoSchema, NotificacaoUpdateSchema } from '../../utils/validators/schemas/zod/NotificacaoSchema.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let usuarioAuthId;
let outroUsuarioId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempNotificacoes = [];
const tempUsuarios = [];

function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}
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
            message: 'Nao autorizado. Faca login para continuar.',
            data: null,
            errors: [],
        });
    });
}
async function criarUsuario(nome, extra = {}) {
    const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const usuario = await Usuario.create({
        nome,
        email: `${slug}-${nextId('mail')}@test.local`,
        senha: 'teste123',
        ...extra,
    });
    tempUsuarios.push(usuario._id);
    return usuario._id;
}

async function criarNotificacao(usuarioId = usuarioAuthId, extra = {}) {
    const notificacao = await Notificacao.create({
        usuario_id: usuarioId,
        pedido_id: null,
        tipo: 'geral',
        titulo: nextId('Titulo'),
        mensagem: 'Mensagem de teste para notificacao',
        lida_em: null,
        ...extra,
    });
    tempNotificacoes.push(notificacao._id);
    return notificacao;
}

function payloadNotificacao(extra = {}) {
    return {
        usuario_id: usuarioAuthId.toString(),
        pedido_id: null,
        tipo: 'geral',
        titulo: nextId('TituloPayload'),
        mensagem: 'Mensagem de teste valida',
        ...extra,
    };
}

beforeAll(async () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use('/api', notificacaoRoutes);
    app.use(errorHandler);

    usuarioAuthId = await criarUsuario('Usuario Auth Notificacao');
    outroUsuarioId = await criarUsuario('Outro Usuario Notificacao');

    asAutenticado();
}, 30000);

afterEach(async () => {
    await Notificacao.deleteMany({
        $or: [
            { _id: { $in: tempNotificacoes } },
            { usuario_id: { $in: tempUsuarios } },
        ],
    }).catch(() => {});
    tempNotificacoes.length = 0;

    asAutenticado();
});
afterAll(async () => {
    await Notificacao.deleteMany({
        $or: [
            { _id: { $in: tempNotificacoes } },
            { usuario_id: { $in: tempUsuarios } },
        ],
    }).catch(() => {});

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
describe('POST /notificacoes', () => {
    it('cria notificacao com payload valido -> 201', async () => {
        const res = await request(app)
            .post('/api/notificacoes')
            .send(payloadNotificacao({ titulo: 'Pedido confirmado', tipo: 'pedido_confirmado' }));

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.usuario_id).toBe(usuarioAuthId.toString());
        expect(res.body.data.tipo).toBe('pedido_confirmado');
        expect(res.body.data.titulo).toBe('Pedido confirmado');
        expect(res.body.data.lida_em).toBeNull();

        tempNotificacoes.push(res.body.data._id);
    });

    it('cria notificacao com pedido_id e lida_em opcionais -> 201', async () => {
        const pedidoId = new ObjectId().toString();
        const lidaEm = new Date('2026-01-01T12:00:00.000Z').toISOString();

        const res = await request(app)
            .post('/api/notificacoes')
            .send(payloadNotificacao({
                pedido_id: pedidoId,
                lida_em: lidaEm,
                tipo: 'entregue',
            }));

        expect(res.status).toBe(201);
        expect(res.body.data.pedido_id).toBe(pedidoId);
        expect(res.body.data.tipo).toBe('entregue');
        expect(res.body.data.lida_em).toBe('01/01/2026');

        tempNotificacoes.push(res.body.data._id);
    });

    it('payload invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/notificacoes')
            .send(payloadNotificacao({ tipo: 'invalido', titulo: 'A', mensagem: 'curt' }));

        expect(res.status).toBe(400);
    });

    it('usuario_id invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/notificacoes')
            .send(payloadNotificacao({ usuario_id: INVALID_OBJECT_ID }));

        expect(res.status).toBe(400);
    });

    it('lida_em invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/notificacoes')
            .send(payloadNotificacao({ lida_em: 'data-invalida' }));

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app)
            .post('/api/notificacoes')
            .send(payloadNotificacao());

        expect(res.status).toBe(401);
    });
});
describe('GET /notificacoes', () => {
    it('lista minhas notificacoes ordenadas por criacao recente -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { titulo: 'Antiga' });
        await criarNotificacao(usuarioAuthId, { titulo: 'Nova' });
        await criarNotificacao(outroUsuarioId, { titulo: 'De outro usuario' });

        const res = await request(app).get('/api/notificacoes');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data.totalDocs).toBe(2);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(notificacao => notificacao.titulo)).toEqual(['Nova', 'Antiga']);
    });

    it('retorna lista vazia sem filtros -> 200', async () => {
        const res = await request(app).get('/api/notificacoes');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('Nenhuma');
    });

    it('filtra notificacoes lidas -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { titulo: 'Lida', lida_em: new Date() });
        await criarNotificacao(usuarioAuthId, { titulo: 'Nao lida', lida_em: null });

        const res = await request(app).get('/api/notificacoes?lida=true');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].titulo).toBe('Lida');
        expect(res.body.data.docs[0].lida_em).not.toBeNull();
    });

    it('filtra notificacoes nao lidas -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { titulo: 'Lida', lida_em: new Date() });
        await criarNotificacao(usuarioAuthId, { titulo: 'Nao lida', lida_em: null });

        const res = await request(app).get('/api/notificacoes?lida=false');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].titulo).toBe('Nao lida');
        expect(res.body.data.docs[0].lida_em).toBeNull();
    });

    it('ignora valor de lida diferente de true ou false -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { titulo: 'Qualquer' });

        const res = await request(app).get('/api/notificacoes?lida=todas');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
    });

    it('filtra por tipo -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { tipo: 'geral', titulo: 'Geral' });
        await criarNotificacao(usuarioAuthId, { tipo: 'a_caminho', titulo: 'Entrega' });

        const res = await request(app).get('/api/notificacoes?tipo=a_caminho');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].tipo).toBe('a_caminho');
    });

    it('retorna lista vazia com filtros -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { tipo: 'geral' });

        const res = await request(app).get('/api/notificacoes?tipo=cancelado');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('filtros');
    });

    it('ignora tipo vazio -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { tipo: 'geral' });

        const res = await request(app).get('/api/notificacoes?tipo=');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
    });

    it('respeita paginacao customizada -> 200', async () => {
        await criarNotificacao(usuarioAuthId, { titulo: 'Primeira' });
        await criarNotificacao(usuarioAuthId, { titulo: 'Segunda' });

        const res = await request(app).get('/api/notificacoes?page=2&limite=1');

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.limit).toBe(1);
        expect(res.body.data.docs).toHaveLength(1);
    });

    it('limita paginacao a no maximo 100 registros -> 200', async () => {
        await criarNotificacao(usuarioAuthId);

        const res = await request(app).get('/api/notificacoes?limite=500');

        expect(res.status).toBe(200);
        expect(res.body.data.limit).toBe(100);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get('/api/notificacoes');

        expect(res.status).toBe(401);
    });
});
describe('PATCH /notificacoes/:id/lida', () => {
    it('marca notificacao como lida -> 200', async () => {
        const notificacao = await criarNotificacao(usuarioAuthId, { lida_em: null });

        const res = await request(app).patch(`/api/notificacoes/${notificacao._id}/lida`);

        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(notificacao._id.toString());
        expect(res.body.data.lida_em).not.toBeNull();

        const atualizada = await Notificacao.findById(notificacao._id);
        expect(atualizada.lida_em).not.toBeNull();
    });

    it('retorna notificacao quando ja esta lida -> 200', async () => {
        const lidaEm = new Date('2026-01-01T12:00:00.000Z');
        const notificacao = await criarNotificacao(usuarioAuthId, { lida_em: lidaEm });

        const res = await request(app).patch(`/api/notificacoes/${notificacao._id}/lida`);

        expect(res.status).toBe(200);
        expect(res.body.data.lida_em).toBe('01/01/2026');
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).patch(`/api/notificacoes/${INVALID_OBJECT_ID}/lida`);

        expect(res.status).toBe(400);
    });

    it('notificacao inexistente -> 404', async () => {
        const res = await request(app).patch(`/api/notificacoes/${NOT_FOUND_OBJECT_ID}/lida`);

        expect(res.status).toBe(404);
    });

    it('notificacao de outro usuario -> 403', async () => {
        const notificacao = await criarNotificacao(outroUsuarioId);

        const res = await request(app).patch(`/api/notificacoes/${notificacao._id}/lida`);

        expect(res.status).toBe(403);
    });

    it('sem autenticacao -> 401', async () => {
        const notificacao = await criarNotificacao(usuarioAuthId);
        asNaoAutenticado();

        const res = await request(app).patch(`/api/notificacoes/${notificacao._id}/lida`);

        expect(res.status).toBe(401);
    });
});
describe('DELETE /notificacoes/:id', () => {
    it('deleta notificacao do usuario autenticado -> 200', async () => {
        const notificacao = await criarNotificacao(usuarioAuthId);

        const res = await request(app).delete(`/api/notificacoes/${notificacao._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();

        const removida = await Notificacao.findById(notificacao._id);
        expect(removida).toBeNull();
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).delete(`/api/notificacoes/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('notificacao inexistente -> 404', async () => {
        const res = await request(app).delete(`/api/notificacoes/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });

    it('notificacao de outro usuario -> 403', async () => {
        const notificacao = await criarNotificacao(outroUsuarioId);

        const res = await request(app).delete(`/api/notificacoes/${notificacao._id}`);

        expect(res.status).toBe(403);
    });

    it('sem autenticacao -> 401', async () => {
        const notificacao = await criarNotificacao(usuarioAuthId);
        asNaoAutenticado();

        const res = await request(app).delete(`/api/notificacoes/${notificacao._id}`);

        expect(res.status).toBe(401);
    });
});
describe('NotificacaoController - ramos internos', () => {
    it('usa docs.length quando totalDocs nao existe na listagem', async () => {
        const controller = new NotificacaoController();
        controller.service = {
            listarMinhasNotificacoes: jest.fn().mockResolvedValue({ docs: [{ _id: '1' }] }),
        };
        const req = { user_id: usuarioAuthId, query: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await controller.listarMinhas(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('1'),
            data: { docs: [{ _id: '1' }] },
        }));
    });

    it('trata data nula na listagem como vazia', async () => {
        const controller = new NotificacaoController();
        controller.service = {
            listarMinhasNotificacoes: jest.fn().mockResolvedValue(null),
        };
        const req = { user_id: usuarioAuthId };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await controller.listarMinhas(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: null,
            message: expect.stringContaining('Nenhuma'),
        }));
    });
});