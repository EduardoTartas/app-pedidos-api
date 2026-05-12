jest.mock('swagger-jsdoc', () => ({
    __esModule: true,
    default: jest.fn(() => ({ openapi: '3.0.0', info: { title: 'Teste' } })),
}));

const mockSwaggerSetup = jest.fn((docs) => (req, res) => res.status(200).json({ docs }));

jest.mock('swagger-ui-express', () => ({
    __esModule: true,
    default: {
        serve: (req, res, next) => next(),
        setup: (...args) => mockSwaggerSetup(...args),
    },
}));

jest.mock('../../docs/config/head.js', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue({
        definition: {
            openapi: '3.0.0',
            info: { title: 'API Teste', version: '1.0.0' },
        },
    }),
}));

function mockCreateRouteModule(name) {
    const express = require('express');
    const router = express.Router();
    router.get(`/__${name}`, (req, res) => res.status(200).json({ route: name }));
    return { __esModule: true, default: router };
}

jest.mock('../../routes/authRoutes.js', () => mockCreateRouteModule('auth'));
jest.mock('../../routes/usuarioRoutes.js', () => mockCreateRouteModule('usuario'));
jest.mock('../../routes/categoriaRoutes.js', () => mockCreateRouteModule('categoria'));
jest.mock('../../routes/restauranteRoutes.js', () => mockCreateRouteModule('restaurante'));
jest.mock('../../routes/enderecoRoutes.js', () => mockCreateRouteModule('endereco'));
jest.mock('../../routes/pratoRoutes.js', () => mockCreateRouteModule('prato'));
jest.mock('../../routes/adicionalGrupoRoutes.js', () => mockCreateRouteModule('adicional-grupo'));
jest.mock('../../routes/adicionalOpcaoRoutes.js', () => mockCreateRouteModule('adicional-opcao'));
jest.mock('../../routes/pedidoRoutes.js', () => mockCreateRouteModule('pedido'));
jest.mock('../../routes/avaliacaoRoute.js', () => mockCreateRouteModule('avaliacao'));
jest.mock('../../routes/notificacaoRoutes.js', () => mockCreateRouteModule('notificacao'));

import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import swaggerJSDoc from 'swagger-jsdoc';
import getSwaggerOptions from '../../docs/config/head.js';
import routes from '../../routes/index.js';

let originalDebugLog;

function setReadyState(value) {
    Object.defineProperty(mongoose.connection, 'readyState', {
        value,
        configurable: true,
    });
}

function criarApp({ debug = false, readyState = 1 } = {}) {
    if (debug) {
        process.env.DEBUGLOG = 'true';
    } else {
        delete process.env.DEBUGLOG;
    }

    setReadyState(readyState);

    const app = express();
    routes(app);
    return app;
}

beforeEach(() => {
    originalDebugLog = process.env.DEBUGLOG;
    jest.clearAllMocks();
});

afterEach(() => {
    if (originalDebugLog === undefined) {
        delete process.env.DEBUGLOG;
    } else {
        process.env.DEBUGLOG = originalDebugLog;
    }

    delete mongoose.connection.readyState;
});

describe('routes/index', () => {
    it('registra rota raiz, documentacao e health conectado sem DEBUGLOG', async () => {
        const app = criarApp({ debug: false, readyState: 1 });

        const root = await request(app).get('/');
        expect(root.status).toBe(302);
        expect(root.headers.location).toBe('/docs');

        const docs = await request(app).get('/docs');
        expect(docs.status).toBe(200);
        expect(getSwaggerOptions).toHaveBeenCalledTimes(1);
        expect(swaggerJSDoc).toHaveBeenCalledWith({
            definition: {
                openapi: '3.0.0',
                info: { title: 'API Teste', version: '1.0.0' },
            },
        });
        expect(mockSwaggerSetup).toHaveBeenCalledWith({
            openapi: '3.0.0',
            info: { title: 'Teste' },
        });

        const health = await request(app).get('/health');
        expect(health.status).toBe(200);
        expect(health.body).toEqual(expect.objectContaining({
            status: 'healthy',
            database: 'connected',
        }));
    });

    it('registra middleware de log quando DEBUGLOG esta ativo e retorna health desconectado', async () => {
        const app = criarApp({ debug: true, readyState: 0 });

        const health = await request(app).get('/health');

        expect(health.status).toBe(503);
        expect(health.body).toEqual(expect.objectContaining({
            status: 'unhealthy',
            database: 'disconnected',
        }));
    });
});
