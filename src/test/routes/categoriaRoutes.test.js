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

