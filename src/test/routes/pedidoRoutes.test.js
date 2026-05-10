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


function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

function asAutenticado() {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = clienteId;
        next();
    });
}

function autenticarComo(userId) {
    AuthMiddleware.mockImplementation((req, res, next) => {
        req.user_id = userId;
        next();
    });
}

async function criarUsuario(nome, extra = {}, track = false) {
    const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const usuario = await Usuario.create({
        nome,
        email: `${slug}-${nextId('mail')}@test.local`,
        senha: 'teste123',
        ...extra,
    });
    if (track) seedDocumentos.usuarios.push(usuario._id);
    return usuario._id;
}

async function criarRestaurante(nome, donoId, extra = {}, track = false) {
    const restaurante = await Restaurante.create({
        nome,
        cnpj: `${Math.random().toString().slice(2, 14)}`,
        dono_id: donoId,
        ...extra,
    });
    if (track) seedDocumentos.restaurantes.push(restaurante._id);
    return restaurante._id;
}

async function criarPrato(restauranteId, extra = {}, track = false) {
    const pratoCriado = await Prato.create({
        restaurante_id: restauranteId,
        nome: nextId('Prato'),
        preco: 10,
        descricao: 'Prato de teste',
        secao: 'Principais',
        ...extra,
    });
    if (track) seedDocumentos.pratos.push(pratoCriado._id);
    return pratoCriado;
}
async function criarGrupo(restauranteId, extra = {}, track = false) {
    const grupoCriado = await AdicionalGrupo.create({
        restaurante_id: restauranteId,
        nome: nextId('Grupo'),
        tipo: 'adicional',
        obrigatorio: true,
        min: 1,
        max: 1,
        ativo: true,
        ...extra,
    });
    if (track) seedDocumentos.grupos.push(grupoCriado._id);
    return grupoCriado;
}

async function criarOpcao(grupoId, extra = {}, track = false) {
    const opcaoCriada = await AdicionalOpcao.create({
        grupo_id: grupoId,
        nome: nextId('Opcao'),
        preco: 3,
        ativo: true,
        ...extra,
    });
    if (track) seedDocumentos.opcoes.push(opcaoCriada._id);
    return opcaoCriada;
}

beforeAll(async () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use('/api', pedidoRoutes);
    app.use(errorHandler);

    donoId = await criarUsuario('Dono Restaurante', {}, true);
    clienteId = await criarUsuario('Cliente Pedido', {}, true);
    restauranteId = await criarRestaurante('Restaurante Pedido', donoId, {
        status: 'aberto',
        taxa_entrega: 5
    }, true);

    prato = await criarPrato(restauranteId, {}, true);
    grupo = await criarGrupo(restauranteId, {}, true);
    opcao = await criarOpcao(grupo._id, {}, true);
    await Prato.findByIdAndUpdate(prato._id, { $addToSet: { adicionais_grupo_ids: grupo._id } });

    asAutenticado();
}, 30000);
