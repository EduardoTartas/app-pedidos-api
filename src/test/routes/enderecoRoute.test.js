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