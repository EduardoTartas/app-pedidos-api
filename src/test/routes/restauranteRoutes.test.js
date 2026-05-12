jest.mock('../../middlewares/AuthMiddleware.js');
jest.mock('../../service/UploadService.js', () => ({
    __esModule: true,
    default: class {
        constructor() {}
        async substituirImagem() {
            return {
                url: 'http://test.com/restaurante.jpg',
                fileName: 'restaurante.jpg',
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
import { cnpj as cnpjUtil } from 'cpf-cnpj-validator';
import express from 'express';
import expressFileUpload from 'express-fileupload';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import restauranteRoutes from '../../routes/restauranteRoutes.js';
import Categoria from '../../models/Categoria.js';
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
let categoriaPrincipalId;
let categoriaSecundariaId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const tempRestaurantes = [];
const tempCategorias = [];
const tempUsuarios = [];

function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

function gerarCnpj() {
    return cnpjUtil.generate(false);
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

async function criarCategoria(extra = {}) {
    const categoria = await Categoria.create({
        nome: nextId('Categoria'),
        icone_categoria: '',
        ativo: true,
        ...extra,
    });
    tempCategorias.push(categoria._id);
    return categoria._id;
}

async function criarRestaurante(donoId = ownerId, extra = {}) {
    const restaurante = await Restaurante.create({
        nome: nextId('Restaurante'),
        foto_restaurante: '',
        dono_id: donoId,
        status: 'fechado',
        categoria_ids: [categoriaPrincipalId],
        secoes_cardapio: ['Principais', 'Bebidas'],
        estimativa_entrega_min: 25,
        estimativa_entrega_max: 45,
        avaliacao_media: 4,
        taxa_entrega: 5,
        cnpj: nextId('cnpj'),
        ...extra,
    });
    tempRestaurantes.push(restaurante._id);
    return restaurante;
}

function payloadRestaurante(extra = {}) {
    return {
        nome: nextId('RestaurantePayload'),
        foto_restaurante: 'http://test.com/restaurante.png',
        categoria_ids: [categoriaPrincipalId.toString()],
        secoes_cardapio: ['Principais', 'Sobremesas'],
        estimativa_entrega_min: 20,
        estimativa_entrega_max: 40,
        taxa_entrega: 3.5,
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
    app.use('/api', restauranteRoutes);
    app.use(errorHandler);

    adminId = await criarUsuario('Admin Restaurante', { isAdmin: true });
    ownerId = await criarUsuario('Dono Restaurante');
    outroUsuarioId = await criarUsuario('Outro Usuario Restaurante');
    categoriaPrincipalId = await criarCategoria({ nome: `Lanches ${RUN_ID}` });
    categoriaSecundariaId = await criarCategoria({ nome: `Massas ${RUN_ID}` });

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempRestaurantes.length > 0) {
        await Restaurante.deleteMany({ _id: { $in: tempRestaurantes } }).catch(() => {});
        tempRestaurantes.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempRestaurantes.length > 0) {
        await Restaurante.deleteMany({ _id: { $in: tempRestaurantes } }).catch(() => {});
    }

    if (tempCategorias.length > 0) {
        await Categoria.deleteMany({ _id: { $in: tempCategorias } }).catch(() => {});
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

describe('GET /restaurantes', () => {
    it('lista restaurantes publicamente em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarRestaurante(ownerId, { nome: 'Z Lanches' });
        await criarRestaurante(outroUsuarioId, { nome: 'A Massas' });

        const res = await request(app).get('/api/restaurantes');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(2);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(restaurante => restaurante.nome)).toEqual(['A Massas', 'Z Lanches']);
    });

    it('filtra por nome, status, categoria, entrega gratis e avaliacao minima -> 200', async () => {
        await criarRestaurante(ownerId, {
            nome: 'Pizza Boa',
            status: 'aberto',
            categoria_ids: [categoriaSecundariaId],
            taxa_entrega: 0,
            avaliacao_media: 4.8,
        });
        await criarRestaurante(ownerId, {
            nome: 'Pizza Fechada',
            status: 'fechado',
            categoria_ids: [categoriaSecundariaId],
            taxa_entrega: 0,
            avaliacao_media: 4.9,
        });
        await criarRestaurante(ownerId, {
            nome: 'Burger Pago',
            status: 'aberto',
            categoria_ids: [categoriaPrincipalId],
            taxa_entrega: 7,
            avaliacao_media: 4.8,
        });

        const res = await request(app)
            .get(`/api/restaurantes?nome=pizza&status=aberto&categoria=${categoriaSecundariaId}&entrega_gratis=true&avaliacao_min=4.5`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].nome).toBe('Pizza Boa');
    });

    it('ordena dinamicamente e respeita paginacao customizada -> 200', async () => {
        await criarRestaurante(ownerId, { nome: 'Barato', taxa_entrega: 1 });
        await criarRestaurante(ownerId, { nome: 'Caro', taxa_entrega: 9 });

        const res = await request(app).get('/api/restaurantes?ordenar=taxa_entrega&ordem=desc&page=2&limite=1');

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.limit).toBe(1);
        expect(res.body.data.docs).toHaveLength(1);
        expect(res.body.data.docs[0].nome).toBe('Barato');
    });

    it('retorna mensagem de nenhum restaurante cadastrado quando vazio -> 200', async () => {
        const res = await request(app).get('/api/restaurantes');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('Nenhum restaurante cadastrado');
    });

    it('retorna mensagem especifica quando filtros nao encontram restaurante -> 200', async () => {
        await criarRestaurante(ownerId, { nome: 'Existente' });

        const res = await request(app).get('/api/restaurantes?nome=NaoExiste');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('filtros');
    });

    it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/restaurantes?page=0');

        expect(res.status).toBe(400);
    });
});

describe('GET /restaurantes/meus', () => {
    it('lista somente restaurantes do dono autenticado -> 200', async () => {
        await criarRestaurante(ownerId, { nome: 'Meu Restaurante' });
        await criarRestaurante(outroUsuarioId, { nome: 'Restaurante Alheio' });

        const res = await request(app).get('/api/restaurantes/meus');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].nome).toBe('Meu Restaurante');
        expect(res.body.data.docs[0].dono_id._id).toBe(ownerId.toString());
    });

    it('administrador lista restaurantes de todos os donos -> 200', async () => {
        await criarRestaurante(ownerId, { nome: 'Restaurante Dono' });
        await criarRestaurante(outroUsuarioId, { nome: 'Restaurante Outro' });
        autenticarComoUmaVez(adminId);

        const res = await request(app).get('/api/restaurantes/meus');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(2);
    });

    it('retorna mensagem quando usuario nao possui restaurantes -> 200', async () => {
        const res = await request(app).get('/api/restaurantes/meus');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('sob sua');
    });

    it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/restaurantes/meus?avaliacao_min=9');

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get('/api/restaurantes/meus');

        expect(res.status).toBe(401);
    });
});

describe('GET /restaurantes/:id', () => {
    it('busca restaurante por id em rota publica -> 200', async () => {
        const restaurante = await criarRestaurante(ownerId, { nome: 'Detalhado' });

        const res = await request(app).get(`/api/restaurantes/${restaurante._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(restaurante._id.toString());
        expect(res.body.data.nome).toBe('Detalhado');
        expect(res.body.data.dono_id._id).toBe(ownerId.toString());
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).get(`/api/restaurantes/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('restaurante inexistente -> 404', async () => {
        const res = await request(app).get(`/api/restaurantes/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });
});

describe('POST /restaurantes', () => {
    it('cria restaurante atribuindo dono autenticado e status padrao fechado -> 201', async () => {
        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ nome: 'Novo Restaurante', status: undefined }));

        expect(res.status).toBe(201);
        expect(res.body.data.nome).toBe('Novo Restaurante');
        expect(res.body.data.dono_id).toBe(ownerId.toString());
        expect(res.body.data.status).toBe('fechado');

        tempRestaurantes.push(res.body.data._id);
    });

    it('cria restaurante com cnpj valido -> 201', async () => {
        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ nome: 'Com CNPJ', cnpj: gerarCnpj() }));

        expect(res.status).toBe(201);
        expect(res.body.data.cnpj).toHaveLength(14);

        tempRestaurantes.push(res.body.data._id);
    });

    it('corpo vazio -> 400', async () => {
        const res = await request(app).post('/api/restaurantes').send({});

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ nome: 'A', taxa_entrega: -1 }));

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante());

        expect(res.status).toBe(401);
    });

    it('usuario autenticado inexistente -> 404', async () => {
        autenticarComoUmaVez(NOT_FOUND_OBJECT_ID);

        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante());

        expect(res.status).toBe(404);
    });

    it('nome duplicado -> 409', async () => {
        await criarRestaurante(ownerId, { nome: 'Nome Repetido' });

        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ nome: 'Nome Repetido' }));

        expect(res.status).toBe(409);
    });

    it('categoria inexistente -> 400', async () => {
        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ categoria_ids: [NOT_FOUND_OBJECT_ID] }));

        expect(res.status).toBe(400);
    });

    it('cnpj invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ cnpj: '12345678901234' }));

        expect(res.status).toBe(400);
    });

    it('cnpj duplicado -> 409', async () => {
        const cnpj = gerarCnpj();
        await criarRestaurante(ownerId, { nome: 'CNPJ Existente', cnpj });

        const res = await request(app)
            .post('/api/restaurantes')
            .send(payloadRestaurante({ nome: 'CNPJ Novo', cnpj }));

        expect(res.status).toBe(409);
    });
});

