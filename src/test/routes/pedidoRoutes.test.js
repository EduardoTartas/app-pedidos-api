jest.mock('../../middlewares/AuthMiddleware.js');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import pedidoRoutes from '../../routes/pedidoRoutes.js';
import '../../models/Restaurante.js';
import '../../models/Categoria.js';
import '../../models/Prato.js';
import '../../models/AdicionalGrupo.js';
import '../../models/AdicionalOpcao.js';
import '../../models/Pedido.js';
import '../../models/Usuario.js';
import Restaurante from '../../models/Restaurante.js';
import Prato from '../../models/Prato.js';
import AdicionalGrupo from '../../models/AdicionalGrupo.js';
import AdicionalOpcao from '../../models/AdicionalOpcao.js';
import Pedido from '../../models/Pedido.js';
import Usuario from '../../models/Usuario.js';
import Notificacao from '../../models/Notificacao.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);
let app;
let mongoServer;
let donoId;
let clienteId;
let restauranteId;
let prato;
let grupo;
let opcao;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;
const seedDocumentos = {
    usuarios: [],
    restaurantes: [],
    pratos: [],
    grupos: [],
    opcoes: []
};
const testDocumentos = {
    pedidos: [],
    notificacoes: []
};
