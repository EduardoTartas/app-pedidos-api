jest.mock('../../middlewares/AuthMiddleware.js');
jest.mock('../../service/UploadService.js', () => ({
    __esModule: true,
    default: class {
        constructor() {}
        async substituirImagem() {
            return {
                url: 'http://test.com/prato.jpg',
                fileName: 'prato.jpg',
                metadata: { contentType: 'image/jpeg' },
            };
        }
        async deleteImagemComRetry() {
            return true;
        }
    },
}));

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import expressFileUpload from 'express-fileupload';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import pratoRoutes from '../../routes/pratoRoutes.js';
import '../../models/Categoria.js';
import Prato from '../../models/Prato.js';
import Restaurante from '../../models/Restaurante.js';
import Usuario from '../../models/Usuario.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let adminId;
let ownerId;
let outroUsuarioId;
let restauranteId;
let outroRestauranteId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempPratos = [];
const tempRestaurantes = [];
const tempUsuarios = [];

function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

function asAutenticado() {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = ownerId;
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

async function criarRestaurante(nome, donoId, extra = {}) {
    const restaurante = await Restaurante.create({
        nome,
        cnpj: nextId('cnpj'),
        dono_id: donoId,
        secoes_cardapio: ['Principais', 'Sobremesas', 'Bebidas'],
        ...extra,
    });
    tempRestaurantes.push(restaurante._id);
    return restaurante._id;
}

async function criarPrato(restId = restauranteId, extra = {}) {
    const prato = await Prato.create({
        restaurante_id: restId,
        nome: nextId('Prato'),
        foto_prato: '',
        preco: 25.9,
        descricao: 'Prato de teste',
        secao: 'Principais',
        status: 'ativo',
        ...extra,
    });
    tempPratos.push(prato._id);
    return prato;
}

function payloadPrato(restId = restauranteId, extra = {}) {
    return {
        restaurante_id: restId.toString(),
        nome: nextId('PratoPayload'),
        foto_prato: 'http://test.com/prato.png',
        preco: 32.5,
        descricao: 'Prato valido para teste',
        secao: 'Principais',
        status: 'ativo',
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
    app.use(expressFileUpload());
    app.use('/api', pratoRoutes);
    app.use(errorHandler);

    adminId = await criarUsuario('Admin Prato', { isAdmin: true });
    ownerId = await criarUsuario('Dono Prato');
    outroUsuarioId = await criarUsuario('Outro Usuario Prato');
    restauranteId = await criarRestaurante(`Restaurante Prato ${RUN_ID}`, ownerId);
    outroRestauranteId = await criarRestaurante(`Outro Restaurante Prato ${RUN_ID}`, outroUsuarioId);

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempPratos.length > 0) {
        await Prato.deleteMany({ _id: { $in: tempPratos } }).catch(() => {});
        tempPratos.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
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

describe('GET /pratos', () => {
    it('lista pratos em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Z Dona' });
        await criarPrato(restauranteId, { nome: 'A Dona' });
        await criarPrato(outroRestauranteId, { nome: 'Outro Restaurante' });

        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(3);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(prato => prato.nome)).toEqual(['A Dona', 'Outro Restaurante', 'Z Dona']);
    });

    it('administrador lista pratos de todos os restaurantes -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Prato Dono' });
        await criarPrato(outroRestauranteId, { nome: 'Prato Outro' });
        autenticarComoUmaVez(adminId);

        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(2);
        expect(res.body.data.docs.map(prato => prato.restaurante_id).sort()).toEqual(
            [restauranteId.toString(), outroRestauranteId.toString()].sort(),
        );
    });

    it('filtra por nome, status, secao e faixa de preco -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Lasanha', preco: 40, secao: 'Principais', status: 'ativo' });
        await criarPrato(restauranteId, { nome: 'Lasanha Inativa', preco: 40, secao: 'Principais', status: 'inativo' });
        await criarPrato(restauranteId, { nome: 'Pudim', preco: 12, secao: 'Sobremesas', status: 'ativo' });

        const res = await request(app).get('/api/pratos?nome=lasanha&status=inativo&secao=Principais&preco_min=30&preco_max=50');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].nome).toBe('Lasanha Inativa');
    });

    it('retorna mensagem de nenhum prato quando nao ha cadastros do dono -> 200', async () => {
        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('Nenhum prato');
    });

    it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/pratos?page=0');

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(401);
    });
});

describe('GET /pratos/:id', () => {
    it('busca prato por id em rota publica -> 200', async () => {
        const prato = await criarPrato(restauranteId, { nome: 'X Tudo' });

        const res = await request(app).get(`/api/pratos/${prato._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0]._id).toBe(prato._id.toString());
        expect(res.body.data.docs[0].nome).toBe('X Tudo');
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).get(`/api/pratos/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

});