jest.mock('../../middlewares/AuthMiddleware.js');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import enderecoRoutes from '../../routes/enderecoRoutes.js';
import Endereco from '../../models/Endereco.js';
import Usuario from '../../models/Usuario.js';
import Restaurante from '../../models/Restaurante.js';
import '../../models/Categoria.js';
import EnderecoController from '../../controllers/EnderecoController.js';
import EnderecoService from '../../service/EnderecoService.js';
import EnderecoRepository from '../../repository/EnderecoRepository.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let adminId;
let ownerId;
let usuarioAuthId;
let outroUsuarioId;
let restauranteId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempEnderecos = [];
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

async function criarRestaurante(nome, donoId, extra = {}) {
    const restaurante = await Restaurante.create({
        nome,
        cnpj: nextId('cnpj'),
        dono_id: donoId,
        ...extra,
    });
    tempRestaurantes.push(restaurante._id);
    return restaurante._id;
}


async function criarEnderecoUsuario(usuarioId, extra = {}) {
    const endereco = await Endereco.create({
        usuario_id: usuarioId,
        restaurante_id: null,
        ...payloadEndereco(),
        ...extra,
    });
    tempEnderecos.push(endereco._id);
    return endereco;
}

async function criarEnderecoRestaurante(restId, extra = {}) {
    const endereco = await Endereco.create({
        usuario_id: null,
        restaurante_id: restId,
        principal: false,
        ...payloadEndereco({ label: 'Sede' }),
        ...extra,
    });
    tempEnderecos.push(endereco._id);
    return endereco;
}

function payloadEndereco(extra = {}) {
    return {
        label: nextId('Casa'),
        cep: '76800000',
        rua: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        complemento: 'Apto 1',
        cidade: 'Porto Velho',
        estado: 'RO',
        principal: false,
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
    app.use('/api', enderecoRoutes);
    app.use(errorHandler);

    adminId = await criarUsuario('Admin Endereco', { isAdmin: true });
    ownerId = await criarUsuario('Dono Endereco');
    usuarioAuthId = await criarUsuario('Usuario Auth Endereco');
    outroUsuarioId = await criarUsuario('Outro Usuario Endereco');
    restauranteId = await criarRestaurante(`Restaurante Endereco ${RUN_ID}`, ownerId);

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempEnderecos.length > 0) {
        await Endereco.deleteMany({ _id: { $in: tempEnderecos } }).catch(() => {});
        tempEnderecos.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempEnderecos.length > 0) {
        await Endereco.deleteMany({ _id: { $in: tempEnderecos } }).catch(() => {});
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


describe('GET /usuarios/:usuarioId/enderecos', () => {
    it('lista enderecos do proprio usuario com principal primeiro -> 200', async () => {
        await criarEnderecoUsuario(usuarioAuthId, { label: 'Trabalho', principal: false });
        await criarEnderecoUsuario(usuarioAuthId, { label: 'Casa', principal: true });

        const res = await request(app).get(`/api/usuarios/${usuarioAuthId}/enderecos`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0].label).toBe('Casa');
        expect(res.body.data[0].principal).toBe(true);
    });

    it('administrador lista enderecos de qualquer usuario -> 200', async () => {
        await criarEnderecoUsuario(outroUsuarioId, { label: 'Outro' });
        autenticarComoUmaVez(adminId);

        const res = await request(app).get(`/api/usuarios/${outroUsuarioId}/enderecos`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].usuario_id).toBe(outroUsuarioId.toString());
    });