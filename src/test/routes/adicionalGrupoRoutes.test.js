jest.mock('../../middlewares/AuthMiddleware.js');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import adicionalGrupoRoutes from '../../routes/adicionalGrupoRoutes.js';
import '../../models/Categoria.js';
import AdicionalGrupo from '../../models/AdicionalGrupo.js';
import AdicionalOpcao from '../../models/AdicionalOpcao.js';
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

const tempGrupos = [];
const tempOpcoes = [];
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
        ...extra,
    });
    tempOpcoes.push(opcao._id);
    return opcao;
}

function payloadGrupo(pratoId, extra = {}) {
    return {
        prato_id: pratoId.toString(),
        nome: nextId('GrupoPayload'),
        tipo: 'adicional',
        obrigatorio: false,
        min: 0,
        max: 3,
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
    app.use('/api', adicionalGrupoRoutes);
    app.use(errorHandler);

    ownerId = await criarUsuario('Dono Adicional Grupo');
    usuarioAuthId = await criarUsuario('Usuario Auth Adicional Grupo');
    restauranteId = await criarRestaurante(`Restaurante Adicional Grupo ${RUN_ID}`, ownerId);

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

describe('GET /adicionais/grupos/prato/:pratoId', () => {
    it('lista grupos ativos de um prato em ordem alfabetica -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        await criarGrupo(prato._id, restauranteId, { nome: 'Zeta' });
        await criarGrupo(prato._id, restauranteId, { nome: 'Alpha' });
        await criarGrupo(prato._id, restauranteId, { nome: 'Beta', ativo: false });

        const res = await request(app).get(`/api/adicionais/grupos/prato/${prato._id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data.map(grupo => grupo.nome)).toEqual(['Alpha', 'Zeta']);
    });

    it('pratoId invalido -> 400', async () => {
        const res = await request(app).get(`/api/adicionais/grupos/prato/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
    });

    it('prato inexistente -> 404', async () => {
        const res = await request(app).get(`/api/adicionais/grupos/prato/${NOT_FOUND_OBJECT_ID}`);
        expect(res.status).toBe(404);
    });
});

describe('GET /adicionais/grupos/:id', () => {
    it('busca grupo por id em rota publica -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId, { nome: 'Molhos' });

        const res = await request(app).get(`/api/adicionais/grupos/${grupo._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(grupo._id.toString());
        expect(res.body.data.nome).toBe('Molhos');
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).get(`/api/adicionais/grupos/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
    });

    it('grupo inexistente -> 404', async () => {
        const res = await request(app).get(`/api/adicionais/grupos/${NOT_FOUND_OBJECT_ID}`);
        expect(res.status).toBe(404);
    });
});

describe('POST /adicionais/grupos', () => {
    it('cria grupo como dono do restaurante e vincula ao prato -> 201', async () => {
        const prato = await criarPrato(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/grupos')
            .send(payloadGrupo(prato._id, { nome: 'Bebidas' }));

        expect(res.status).toBe(201);
        expect(res.body.data.nome).toBe('Bebidas');
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());

        tempGrupos.push(res.body.data._id);

        const pratoAtualizado = await Prato.findById(prato._id);
        expect(pratoAtualizado.adicionais_grupo_ids.map(id => String(id))).toContain(res.body.data._id);
    });

    it('payload invalido -> 400', async () => {
        const prato = await criarPrato(restauranteId);

        const res = await request(app)
            .post('/api/adicionais/grupos')
            .send(payloadGrupo(prato._id, { min: -1 }));

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        asNaoAutenticado();

        const res = await request(app)
            .post('/api/adicionais/grupos')
            .send(payloadGrupo(prato._id));

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const prato = await criarPrato(restauranteId);

        const res = await request(app)
            .post('/api/adicionais/grupos')
            .send(payloadGrupo(prato._id));

        expect(res.status).toBe(403);
    });

    it('nome duplicado no mesmo prato -> 409', async () => {
        const prato = await criarPrato(restauranteId);
        autenticarComo(ownerId);

        const payload = payloadGrupo(prato._id, { nome: 'Complementos' });

        const firstRes = await request(app)
            .post('/api/adicionais/grupos')
            .send(payload);

        expect(firstRes.status).toBe(201);
        tempGrupos.push(firstRes.body.data._id);

        const secondRes = await request(app)
            .post('/api/adicionais/grupos')
            .send({ ...payload, nome: 'Complementos' });

        expect(secondRes.status).toBe(409);
    });

    it('prato_id inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/adicionais/grupos')
            .send(payloadGrupo(NOT_FOUND_OBJECT_ID));

        expect(res.status).toBe(404);
    });
});

describe('PATCH /adicionais/grupos/:id', () => {
    it('atualiza grupo como dono -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId, { nome: 'Sobremesas' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/adicionais/grupos/${grupo._id}`)
            .send({ nome: 'Sobremesas Premium', max: 5 });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Sobremesas Premium');
        expect(res.body.data.max).toBe(5);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app)
            .patch(`/api/adicionais/grupos/${INVALID_OBJECT_ID}`)
            .send({ nome: 'Novo Nome' });

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);

        const res = await request(app)
            .patch(`/api/adicionais/grupos/${grupo._id}`)
            .send({ min: -2 });

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/adicionais/grupos/${grupo._id}`)
            .send({ nome: 'Nome Bloqueado' });

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);

        const res = await request(app)
            .patch(`/api/adicionais/grupos/${grupo._id}`)
            .send({ nome: 'Tentativa Sem Permissao' });

        expect(res.status).toBe(403);
    });

    it('grupo inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/adicionais/grupos/${NOT_FOUND_OBJECT_ID}`)
            .send({ nome: 'Nao Existe' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /adicionais/grupos/:id', () => {
    it('deleta grupo, remove opcoes e desfaz vinculo com prato -> 200', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId, { nome: 'Coberturas' });
        await criarOpcao(grupo._id, { nome: 'Chocolate' });
        await criarOpcao(grupo._id, { nome: 'Caramelo' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/adicionais/grupos/${grupo._id}`);

        expect(res.status).toBe(200);

        const grupoRemovido = await AdicionalGrupo.findById(grupo._id);
        expect(grupoRemovido).toBeNull();

        const opcoesRemovidas = await AdicionalOpcao.countDocuments({ grupo_id: grupo._id });
        expect(opcoesRemovidas).toBe(0);

        const pratoAtualizado = await Prato.findById(prato._id);
        expect(pratoAtualizado.adicionais_grupo_ids.map(id => String(id))).not.toContain(grupo._id.toString());
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).delete(`/api/adicionais/grupos/${INVALID_OBJECT_ID}`);
        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);
        asNaoAutenticado();

        const res = await request(app).delete(`/api/adicionais/grupos/${grupo._id}`);
        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const prato = await criarPrato(restauranteId);
        const grupo = await criarGrupo(prato._id, restauranteId);

        const res = await request(app).delete(`/api/adicionais/grupos/${grupo._id}`);
        expect(res.status).toBe(403);
    });

    it('grupo inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/adicionais/grupos/${NOT_FOUND_OBJECT_ID}`);
        expect(res.status).toBe(404);
    });
});
