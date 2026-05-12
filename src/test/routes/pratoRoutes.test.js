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

beforeAll(async () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use(expressFileUpload());
    app.use('/api', pratoRoutes);
    app.use(errorHandler);

    adminId = await criarUsuario('Admin Prato', { isAdmin: true });
    ownerId = await criarUsuario('Dono Prato');
    outroUsuarioId = await criarUsuario('Outro Usuario Prato');
    restauranteId = await criarRestaurante(`Restaurante Prato ${RUN_ID}`, ownerId);
    outroRestauranteId = await criarRestaurante(`Outro Restaurante Prato ${RUN_ID}`, outroUsuarioId);

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempPratos.length > 0) {
        await Prato.deleteMany({ _id: { $in: tempPratos } }).catch(() => {});
        tempPratos.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempPratos.length > 0) {
        await Prato.deleteMany({ _id: { $in: tempPratos } }).catch(() => {});
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

describe('GET /pratos', () => {
    it('lista pratos em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Z Dona' });
        await criarPrato(restauranteId, { nome: 'A Dona' });
        await criarPrato(outroRestauranteId, { nome: 'Outro Restaurante' });

        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(3);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(prato => prato.nome)).toEqual(['A Dona', 'Outro Restaurante', 'Z Dona']);
    });

    it('administrador lista pratos de todos os restaurantes -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Prato Dono' });
        await criarPrato(outroRestauranteId, { nome: 'Prato Outro' });
        autenticarComoUmaVez(adminId);

        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(2);
        expect(res.body.data.docs.map(prato => prato.restaurante_id).sort()).toEqual(
            [restauranteId.toString(), outroRestauranteId.toString()].sort(),
        );
    });

    it('filtra por nome, status, secao e faixa de preco -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Lasanha', preco: 40, secao: 'Principais', status: 'ativo' });
        await criarPrato(restauranteId, { nome: 'Lasanha Inativa', preco: 40, secao: 'Principais', status: 'inativo' });
        await criarPrato(restauranteId, { nome: 'Pudim', preco: 12, secao: 'Sobremesas', status: 'ativo' });

        const res = await request(app).get('/api/pratos?nome=lasanha&status=inativo&secao=Principais&preco_min=30&preco_max=50');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].nome).toBe('Lasanha Inativa');
    });

    it('retorna mensagem de nenhum prato quando nao ha cadastros do dono -> 200', async () => {
        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('Nenhum prato');
    });

    it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/pratos?page=0');

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get('/api/pratos');

        expect(res.status).toBe(401);
    });
});

describe('GET /pratos/:id', () => {
    it('busca prato por id em rota publica -> 200', async () => {
        const prato = await criarPrato(restauranteId, { nome: 'X Tudo' });

        const res = await request(app).get(`/api/pratos/${prato._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0]._id).toBe(prato._id.toString());
        expect(res.body.data.docs[0].nome).toBe('X Tudo');
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).get(`/api/pratos/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

});



describe('GET /cardapio/:restauranteId', () => {
    it('retorna cardapio publico agrupado por secao apenas com pratos ativos -> 200', async () => {
        await criarPrato(restauranteId, { nome: 'Burger', secao: 'Principais', status: 'ativo' });
        await criarPrato(restauranteId, { nome: 'Refrigerante', secao: 'Bebidas', status: 'ativo' });
        await criarPrato(restauranteId, { nome: 'Sem Secao', secao: '', status: 'ativo' });
        await criarPrato(restauranteId, { nome: 'Fora do Cardapio', secao: 'Principais', status: 'inativo' });

        const res = await request(app).get(`/api/cardapio/${restauranteId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.Principais).toHaveLength(1);
        expect(res.body.data.Bebidas).toHaveLength(1);
        expect(res.body.data.Geral).toHaveLength(1);
        expect(Object.values(res.body.data).flat().map(prato => prato.nome)).not.toContain('Fora do Cardapio');
    });

    it('retorna objeto vazio quando restaurante nao possui pratos ativos -> 200', async () => {
        const res = await request(app).get(`/api/cardapio/${restauranteId}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({});
        expect(res.body.message).toContain('Nenhum prato');
    });

    it('restauranteId invalido -> 400', async () => {
        const res = await request(app).get(`/api/cardapio/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('restaurante inexistente -> 404', async () => {
        const res = await request(app).get(`/api/cardapio/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });
});

describe('POST /pratos', () => {
    it('cria prato como dono do restaurante -> 201', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(restauranteId, { nome: 'Pizza Especial' }));

        expect(res.status).toBe(201);
        expect(res.body.data.nome).toBe('Pizza Especial');
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());
        expect(res.body.data.secao).toBe('Principais');

        tempPratos.push(res.body.data._id);
    });

    it('administrador cria prato em qualquer restaurante -> 201', async () => {
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(outroRestauranteId, { nome: 'Admin Burger' }));

        expect(res.status).toBe(201);
        expect(res.body.data.nome).toBe('Admin Burger');
        expect(res.body.data.restaurante_id).toBe(outroRestauranteId.toString());

        tempPratos.push(res.body.data._id);
    });

    it('corpo vazio -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app).post('/api/pratos').send({});

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(restauranteId, { preco: -1 }));

        expect(res.status).toBe(400);
    });

    it('secao fora do cardapio do restaurante -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(restauranteId, { secao: 'Executivos' }));

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(restauranteId));

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        autenticarComoUmaVez(outroUsuarioId);

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(restauranteId));

        expect(res.status).toBe(403);
    });

    it('restaurante inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post('/api/pratos')
            .send(payloadPrato(NOT_FOUND_OBJECT_ID));

        expect(res.status).toBe(404);
    });
});

describe('PATCH /pratos/:id', () => {
    it('atualiza prato como dono do restaurante -> 200', async () => {
        const prato = await criarPrato(restauranteId, { nome: 'Nome Antigo' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ nome: 'Nome Novo', preco: 45.5, status: 'inativo' });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Nome Novo');
        expect(res.body.data.preco).toBe(45.5);
        expect(res.body.data.status).toBe('inativo');
    });

    it('nao permite alterar restaurante_id pelo payload -> 200', async () => {
        const prato = await criarPrato(restauranteId, { nome: 'Prato Fixo' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ restaurante_id: outroRestauranteId.toString(), nome: 'Prato Ainda Fixo' });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Prato Ainda Fixo');
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());
    });

    it('administrador atualiza prato de qualquer restaurante -> 200', async () => {
        const prato = await criarPrato(outroRestauranteId, { nome: 'Prato Outro' });
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ nome: 'Prato Outro Editado' });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Prato Outro Editado');
    });

    it('corpo vazio -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('id invalido -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${INVALID_OBJECT_ID}`)
            .send({ nome: 'Novo Nome' });

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ foto_prato: 'arquivo.txt' });

        expect(res.status).toBe(400);
    });

    it('secao fora do cardapio -> 400', async () => {
        const prato = await criarPrato(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ secao: 'Executivos' });

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const prato = await criarPrato(restauranteId);
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ nome: 'Bloqueado' });

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const prato = await criarPrato(restauranteId);
        autenticarComoUmaVez(outroUsuarioId);

        const res = await request(app)
            .patch(`/api/pratos/${prato._id}`)
            .send({ nome: 'Sem Permissao' });

        expect(res.status).toBe(403);
    });

    it('prato inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/pratos/${NOT_FOUND_OBJECT_ID}`)
            .send({ nome: 'Nao Existe' });

        expect(res.status).toBe(404);
    });
});
