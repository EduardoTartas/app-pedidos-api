jest.mock('../../middlewares/AuthMiddleware.js');
jest.mock('../../service/UploadService.js', () => ({
    __esModule: true,
    default: class {
        constructor() {}
        async substituirImagem() {
            return {
                url: 'http://test.com/usuario.jpg',
                fileName: 'usuario.jpg',
                metadata: { contentType: 'image/jpeg' },
            };
        }
        async deleteImagemComRetry() {
            return true;
        }
    },
}));
jest.mock('../../service/EmailService.js', () => ({
    __esModule: true,
    default: {
        enviarEmailVerificacao: jest.fn().mockResolvedValue({ messageId: 'email-test' }),
        enviarEmailRecuperacao: jest.fn().mockResolvedValue({ messageId: 'email-test' }),
    },
}));

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import { cpf as cpfUtil } from 'cpf-cnpj-validator';
import express from 'express';
import expressFileUpload from 'express-fileupload';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import Usuario from '../../models/Usuario.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let adminId;
let usuarioAuthId;
let outroUsuarioId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const seedUsuarios = [];
const tempUsuarios = [];

function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

function gerarCpf() {
    return cpfUtil.generate(false);
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
            message: 'Nao autorizado. Faca login para continuar.',
            data: null,
            errors: [],
        });
    });
}

async function criarUsuario(nome, extra = {}, { seed = false } = {}) {
    const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const usuario = await Usuario.create({
        nome,
        email: `${slug}-${nextId('mail')}@test.local`,
        senha: 'teste123',
        status: 'ativo',
        isAdmin: false,
        foto_perfil: '',
        ...extra,
    });

    if (seed) {
        seedUsuarios.push(usuario._id);
    } else {
        tempUsuarios.push(usuario._id);
    }

    return usuario;
}

function payloadUsuario(extra = {}) {
    return {
        nome: nextId('UsuarioPayload'),
        email: `${nextId('usuario')}@test.local`,
        senha: 'Senha@123',
        cpf: gerarCpf(),
        telefone: '11987654321',
        foto_perfil: 'http://test.com/perfil.png',
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
    app.use('/api', usuarioRoutes);
    app.use(errorHandler);

    const admin = await criarUsuario('Admin Usuario', { isAdmin: true }, { seed: true });
    const usuarioAuth = await criarUsuario('Usuario Auth', {}, { seed: true });
    const outroUsuario = await criarUsuario('Outro Usuario', {}, { seed: true });

    adminId = admin._id;
    usuarioAuthId = usuarioAuth._id;
    outroUsuarioId = outroUsuario._id;

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: tempUsuarios } }).catch(() => {});
        tempUsuarios.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: tempUsuarios } }).catch(() => {});
    }

    if (seedUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: seedUsuarios } }).catch(() => {});
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


describe('GET /usuarios', () => {
    it('lista usuarios autenticados em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarUsuario('Zeta Usuario');
        await criarUsuario('Alpha Usuario');

        const res = await request(app).get('/api/usuarios');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data.totalDocs).toBeGreaterThanOrEqual(5);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(usuario => usuario.nome)).toEqual(
            [...res.body.data.docs.map(usuario => usuario.nome)].sort(),
        );
    });

    it('filtra por nome, email, status, cpf, telefone e isAdmin -> 200', async () => {
        const cpf = gerarCpf();
        await criarUsuario('Filtro Usuario', {
            email: 'filtro.usuario@test.local',
            cpf,
            telefone: '11999998888',
            status: 'ativo',
            isAdmin: true,
        });
        await criarUsuario('Outro Filtro', {
            email: 'outro.filtro@test.local',
            cpf: gerarCpf(),
            telefone: '21999998888',
            status: 'inativo',
            isAdmin: false,
        });

        const res = await request(app)
            .get(`/api/usuarios?nome=Filtro&email=filtro.usuario@test.local&status=ativo&cpf=${cpf}&telefone=11999998888&isAdmin=true`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].email).toBe('filtro.usuario@test.local');
        expect(res.body.data.docs[0].isAdmin).toBe(true);
    });

    it('respeita paginacao customizada -> 200', async () => {
        await criarUsuario('Paginado A');
        await criarUsuario('Paginado B');

        const res = await request(app).get('/api/usuarios?page=2&limite=1');

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.limit).toBe(1);
        expect(res.body.data.docs).toHaveLength(1);
    });

    it('retorna mensagem de nenhum usuario com filtros sem resultado -> 200', async () => {
        const res = await request(app).get('/api/usuarios?nome=NaoExisteUsuario');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('filtros');
    });

    it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/usuarios?page=0');

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get('/api/usuarios');

        expect(res.status).toBe(401);
    });
});
