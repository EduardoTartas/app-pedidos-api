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
