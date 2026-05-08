jest.mock('../../middlewares/AuthMiddleware.js');
jest.mock('../../service/UploadService.js', () => ({
    __esModule: true,
    default: class {
        constructor() {}
        async processarImagem() { return { url: 'http://test.com/image.jpg', fileName: 'test.jpg', metadata: {} }; }
        async substituirImagem() { return { url: 'http://test.com/image.jpg', fileName: 'test.jpg', metadata: {} }; }
        async deleteImagemComRetry() { return true; }
    }
}));

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import adicionalOpcaoRoutes from '../../routes/adicionalOpcaoRoutes.js';
import '../../models/Categoria.js';
import AdicionalOpcao from '../../models/AdicionalOpcao.js';
import AdicionalGrupo from '../../models/AdicionalGrupo.js';
import Usuario from '../../models/Usuario.js';
import Restaurante from '../../models/Restaurante.js';
import Prato from '../../models/Prato.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let ownerId;
let usuarioAuthId;
let restauranteId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempOpcoes = [];
const tempGrupos = [];
const tempPratos = [];
const tempRestaurantes = [];
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

async function criarRestaurante(nome, donoId) {
    const restaurante = await Restaurante.create({
        nome,
        cnpj: `${Math.random().toString().slice(2, 14)}`,
        dono_id: donoId,
    });
    tempRestaurantes.push(restaurante._id);
    return restaurante._id;
}

async function criarPrato(restId, extra = {}) {
    const prato = await Prato.create({
        restaurante_id: restId,
        nome: nextId('Prato'),
        preco: 49.9,
        descricao: 'Prato de teste',
        secao: 'Principais',
        ...extra,
    });
    tempPratos.push(prato._id);
    return prato;
}

async function criarGrupo(pratoId, restId, extra = {}, { vincular = true } = {}) {
    const grupo = await AdicionalGrupo.create({
        restaurante_id: restId,
        nome: nextId('Grupo'),
        tipo: 'adicional',
        obrigatorio: false,
        min: 0,
        max: 3,
        ativo: true,
        ...extra,
    });
    tempGrupos.push(grupo._id);

    if (vincular) {
        await Prato.findByIdAndUpdate(pratoId, { $addToSet: { adicionais_grupo_ids: grupo._id } });
    }

    return grupo;
}

async function criarOpcao(grupoId, extra = {}) {
    const opcao = await AdicionalOpcao.create({
        grupo_id: grupoId,
        nome: nextId('Opcao'),
        preco: 3.5,
        ativo: true,
        ...extra,
    });
    tempOpcoes.push(opcao._id);
    return opcao;
}

function payloadOpcao(grupoId, extra = {}) {
    return {
        grupo_id: grupoId.toString(),
        nome: nextId('OpcaoPayload'),
        preco: 5.0,
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
    app.use('/api', adicionalOpcaoRoutes);
    app.use(errorHandler);

    ownerId = await criarUsuario('Dono Adicional Opcao');
    usuarioAuthId = await criarUsuario('Usuario Auth Adicional Opcao');
    restauranteId = await criarRestaurante(`Restaurante Adicional Opcao ${RUN_ID}`, ownerId);

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempOpcoes.length > 0) {
        await AdicionalOpcao.deleteMany({ _id: { $in: tempOpcoes } }).catch(() => {});
        tempOpcoes.length = 0;
    }

    if (tempGrupos.length > 0) {
        await AdicionalGrupo.deleteMany({ _id: { $in: tempGrupos } }).catch(() => {});
        tempGrupos.length = 0;
    }

    if (tempPratos.length > 0) {
        await Prato.deleteMany({ _id: { $in: tempPratos } }).catch(() => {});
        tempPratos.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempOpcoes.length > 0) {
        await AdicionalOpcao.deleteMany({ _id: { $in: tempOpcoes } }).catch(() => {});
    }

    if (tempGrupos.length > 0) {
        await AdicionalGrupo.deleteMany({ _id: { $in: tempGrupos } }).catch(() => {});
    }

    if (tempPratos.length > 0) {
        await Prato.deleteMany({ _id: { $in: tempPratos } }).catch(() => {});
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

describe('GET /adicionais/opcoes/:grupoId', () => {
    it('lista opções ativas de um grupo em ordem alfabetica -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        await criarOpcao(grupo._id, { nome: 'Tomate', preco: 2.0 });
        await criarOpcao(grupo._id, { nome: 'Alface', preco: 1.5 });
        await criarOpcao(grupo._id, { nome: 'Cebola', preco: 1.0, ativo: false });

        const res = await request(app).get(`/api/adicionais/opcoes/${grupo._id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data.map(opcao => opcao.nome)).toEqual(['Alface', 'Tomate']);
        expect(res.body.data.every(opcao => opcao.ativo === true)).toBe(true);
    });

    it('grupoId inválido -> 400', async () => {
        const res = await request(app).get(`/api/adicionais/opcoes/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
    });

    it('grupo inexistente -> 404', async () => {
        const res = await request(app).get(`/api/adicionais/opcoes/${NOT_FOUND_OBJECT_ID}`);
        expect(res.status).toBe(404);
    });

    it('rota pública não requer autenticação -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        await criarOpcao(grupo._id);

        const res = await request(app).get(`/api/adicionais/opcoes/${grupo._id}`);
        expect(res.status).toBe(200);
    });
});

describe('POST /adicionais/opcoes', () => {
    it('cria opção com payload válido mínimo como dono -> 201', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(grupo._id, { nome: 'Salada Extra', preco: 7.5 }));

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.nome).toBe('Salada Extra');
        expect(res.body.data.preco).toBe(7.5);
        expect(res.body.data.grupo_id).toBe(grupo._id.toString());
        expect(res.body.data.ativo).toBe(true);
        expect(res.body.data.foto_adicional).toBe('');

        tempOpcoes.push(res.body.data._id);
    });

    it('preco com valor zero -> 201', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(grupo._id, { nome: 'Brinde', preco: 0 }));

        expect(res.status).toBe(201);
        expect(res.body.data.preco).toBe(0);
        tempOpcoes.push(res.body.data._id);
    });

    it('nome ausente -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send({ grupo_id: grupo._id.toString(), preco: 5.0 });

        expect(res.status).toBe(400);
    });

    it('grupo_id ausente -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send({ nome: 'Sorvete', preco: 3.5 });

        expect(res.status).toBe(400);
    });

    it('grupo_id inválido -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(INVALID_OBJECT_ID));

        expect(res.status).toBe(400);
    });

    it('preco negativo -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(grupo._id, { preco: -5.0 }));

        expect(res.status).toBe(400);
    });

    it('sem autenticação -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        asNaoAutenticado();

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(grupo._id));

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao no restaurante -> 403', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const outroUsuarioId = await criarUsuario('Outro Usuario');

        autenticarComoUmaVez(outroUsuarioId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(grupo._id));

        expect(res.status).toBe(403);
    });

    it('nome duplicado no mesmo grupo -> 409', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        autenticarComo(ownerId);

        const payload = payloadOpcao(grupo._id, { nome: 'Maionese' });

        const firstRes = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payload);

        expect(firstRes.status).toBe(201);
        tempOpcoes.push(firstRes.body.data._id);

        const secondRes = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payload);

        expect(secondRes.status).toBe(409);
    });

    it('grupo_id inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/opcoes')
            .send(payloadOpcao(NOT_FOUND_OBJECT_ID));

        expect(res.status).toBe(404);
    });
});

describe('PATCH /adicionais/opcoes/:id', () => {
    it('atualiza opção como dono -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id, { nome: 'Batata Frita', preco: 4.0 });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${opcao._id}`)
            .send({ nome: 'Batata Frita Suprema', preco: 6.0, ativo: false });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Batata Frita Suprema');
        expect(res.body.data.preco).toBe(6.0);
        expect(res.body.data.ativo).toBe(false);
    });

    it('atualiza apenas preco -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id, { nome: 'Refrigerante', preco: 5.0 });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${opcao._id}`)
            .send({ preco: 5.5 });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Refrigerante');
        expect(res.body.data.preco).toBe(5.5);
    });

    it('id inválido -> 400', async () => {
        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${INVALID_OBJECT_ID}`)
            .send({ nome: 'Novo Nome' });

        expect(res.status).toBe(400);
    });

    it('payload inválido -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id);

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${opcao._id}`)
            .send({ preco: -3.0 });

        expect(res.status).toBe(400);
    });

    it('sem autenticação -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id);
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${opcao._id}`)
            .send({ nome: 'Nome Bloqueado' });

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id);

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${opcao._id}`)
            .send({ nome: 'Tentativa Sem Permissao' });

        expect(res.status).toBe(403);
    });

    it('opção inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${NOT_FOUND_OBJECT_ID}`)
            .send({ nome: 'Nao Existe' });

        expect(res.status).toBe(404);
    });

    it('nome duplicado no mesmo grupo -> 409', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao1 = await criarOpcao(grupo._id, { nome: 'Opcao Um' });
        const opcao2 = await criarOpcao(grupo._id, { nome: 'Opcao Dois' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/adicionais/opcoes/${opcao2._id}`)
            .send({ nome: 'Opcao Um' });

        expect(res.status).toBe(409);
    });
});

describe('DELETE /adicionais/opcoes/:id', () => {
    it('deleta opção como dono -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id, { nome: 'Alho' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/adicionais/opcoes/${opcao._id}`);

        expect(res.status).toBe(200);

        const opcaoRemovida = await AdicionalOpcao.findById(opcao._id);
        expect(opcaoRemovida).toBeNull();
    });

    it('id inválido -> 400', async () => {
        const res = await request(app).delete(`/api/adicionais/opcoes/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
    });

    it('sem autenticação -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id);
        asNaoAutenticado();

        const res = await request(app).delete(`/api/adicionais/opcoes/${opcao._id}`);
        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        const opcao = await criarOpcao(grupo._id);

        const res = await request(app).delete(`/api/adicionais/opcoes/${opcao._id}`);
        expect(res.status).toBe(403);
    });

    it('opção inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/adicionais/opcoes/${NOT_FOUND_OBJECT_ID}`);
        expect(res.status).toBe(404);
    });
});
