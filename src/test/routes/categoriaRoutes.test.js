jest.mock('../../middlewares/AuthMiddleware.js');
jest.mock('../../service/UploadService.js', () => ({
    __esModule: true,
    default: class {
        constructor() {}
        async substituirImagem() {
            return {
                url: 'http://test.com/categoria.jpg',
                fileName: 'categoria.jpg',
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
import categoriaRoutes from '../../routes/categoriaRoutes.js';
import Categoria from '../../models/Categoria.js';
import Usuario from '../../models/Usuario.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let adminId;
let usuarioAuthId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempCategorias = [];
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
async function criarCategoria(extra = {}) {
    const categoria = await Categoria.create({
        nome: nextId('Categoria'),
        icone_categoria: '',
        ativo: true,
        ...extra,
    });
    tempCategorias.push(categoria._id);
    return categoria;
}

function payloadCategoria(extra = {}) {
    return {
        nome: nextId('CategoriaPayload'),
        icone_categoria: 'http://test.com/icone.png',
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
    app.use('/api', categoriaRoutes);
    app.use(errorHandler);

    adminId = await criarUsuario('Admin Categoria', { isAdmin: true });
    usuarioAuthId = await criarUsuario('Usuario Categoria');

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempCategorias.length > 0) {
        await Categoria.deleteMany({ _id: { $in: tempCategorias } }).catch(() => {});
        tempCategorias.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempCategorias.length > 0) {
        await Categoria.deleteMany({ _id: { $in: tempCategorias } }).catch(() => {});
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

describe('GET /categorias', () => {
    it('lista categorias em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarCategoria({ nome: 'Z Massas' });
        await criarCategoria({ nome: 'A Lanches' });

        const res = await request(app).get('/api/categorias');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data).toHaveProperty('totalDocs');
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(categoria => categoria.nome)).toEqual(['A Lanches', 'Z Massas']);
    });

describe('GET /categorias', () => {
    it('lista categorias em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarCategoria({ nome: 'Z Massas' });
        await criarCategoria({ nome: 'A Lanches' });

        const res = await request(app).get('/api/categorias');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data).toHaveProperty('totalDocs');
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(categoria => categoria.nome)).toEqual(['A Lanches', 'Z Massas']);
    });
    it('filtra por nome ignorando acentos -> 200', async () => {
        await criarCategoria({ nome: 'Açaí' });
        await criarCategoria({ nome: 'Pizza' });

        const res = await request(app).get('/api/categorias?nome=acai');

        expect(res.status).toBe(200);
        expect(res.body.data.docs).toHaveLength(1);
        expect(res.body.data.docs[0].nome).toBe('Açaí');
    });
    it('filtra por ativo=false -> 200', async () => {
        await criarCategoria({ nome: 'Ativa', ativo: true });
        await criarCategoria({ nome: 'Inativa', ativo: false });

        const res = await request(app).get('/api/categorias?ativo=false');

        expect(res.status).toBe(200);
        expect(res.body.data.docs).toHaveLength(1);
        expect(res.body.data.docs[0].nome).toBe('Inativa');
        expect(res.body.data.docs[0].ativo).toBe(false);
    });
    it('respeita customizacoes de paginacao page=2&limite=1 -> 200', async () => {
        await criarCategoria({ nome: 'Categoria A' });
        await criarCategoria({ nome: 'Categoria B' });

        const res = await request(app).get('/api/categorias?page=2&limite=1');

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.limit).toBe(1);
        expect(res.body.data.docs).toHaveLength(1);
    });
   it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/categorias?page=0');

        expect(res.status).toBe(400);
    });

    it('rota publica nao requer autenticacao -> 200', async () => {
        await criarCategoria({ nome: 'Publica' });

        const res = await request(app).get('/api/categorias');

        expect(res.status).toBe(200);
    });
});