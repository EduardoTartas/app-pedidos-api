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