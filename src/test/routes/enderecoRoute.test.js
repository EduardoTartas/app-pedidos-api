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

    it('retorna lista vazia quando usuario nao possui enderecos -> 200', async () => {
        const res = await request(app).get(`/api/usuarios/${usuarioAuthId}/enderecos`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.message).toContain('Nenhum');
    });

    it('usuario sem permissao -> 403', async () => {
        const res = await request(app).get(`/api/usuarios/${outroUsuarioId}/enderecos`);

        expect(res.status).toBe(403);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get(`/api/usuarios/${usuarioAuthId}/enderecos`);

        expect(res.status).toBe(401);
    });

    it('usuarioId invalido -> 400', async () => {
        const res = await request(app).get(`/api/usuarios/${INVALID_OBJECT_ID}/enderecos`);

        expect(res.status).toBe(400);
    });
});
describe('POST /usuarios/:usuarioId/enderecos', () => {
    it('cria endereco para o proprio usuario -> 201', async () => {
        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadEndereco({ label: 'Casa Principal', principal: true }));

        expect(res.status).toBe(201);
        expect(res.body.data.label).toBe('Casa Principal');
        expect(res.body.data.usuario_id).toBe(usuarioAuthId.toString());
        expect(res.body.data.restaurante_id).toBeNull();
        expect(res.body.data.principal).toBe(true);

        tempEnderecos.push(res.body.data._id);
    });

    it('ao criar endereco principal desmarca os demais do usuario -> 201', async () => {
        const antigoPrincipal = await criarEnderecoUsuario(usuarioAuthId, {
            label: 'Casa Antiga',
            principal: true,
        });

        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadEndereco({ label: 'Casa Nova', principal: true }));

        expect(res.status).toBe(201);
        tempEnderecos.push(res.body.data._id);

        const antigoAtualizado = await Endereco.findById(antigoPrincipal._id);
        expect(antigoAtualizado.principal).toBe(false);
    });

    it('label duplicado para o mesmo usuario -> 409', async () => {
        await criarEnderecoUsuario(usuarioAuthId, { label: 'Casa' });

        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadEndereco({ label: 'Casa' }));

        expect(res.status).toBe(409);
    });

    it('mesmo label permitido para usuarios diferentes -> 201', async () => {
        await criarEnderecoUsuario(outroUsuarioId, { label: 'Casa' });

        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadEndereco({ label: 'Casa' }));

        expect(res.status).toBe(201);
        expect(res.body.data.label).toBe('Casa');
        tempEnderecos.push(res.body.data._id);
    });

    it('cria endereco sem label opcional -> 201', async () => {
        const { label, ...payloadSemLabel } = payloadEndereco();

        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadSemLabel);

        expect(res.status).toBe(201);
        expect(res.body.data.label).toBe('');
        tempEnderecos.push(res.body.data._id);
    });

        it('payload invalido -> 400', async () => {
        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadEndereco({ cep: '123', estado: 'RDO' }));

        expect(res.status).toBe(400);
    });

    it('corpo vazio -> 400', async () => {
        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app)
            .post(`/api/usuarios/${usuarioAuthId}/enderecos`)
            .send(payloadEndereco());

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const res = await request(app)
            .post(`/api/usuarios/${outroUsuarioId}/enderecos`)
            .send(payloadEndereco());

        expect(res.status).toBe(403);
    });

    it('usuario inexistente -> 404', async () => {
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .post(`/api/usuarios/${NOT_FOUND_OBJECT_ID}/enderecos`)
            .send(payloadEndereco());

        expect(res.status).toBe(404);
    });
});

describe('PATCH /usuarios/:usuarioId/enderecos/:enderecoId', () => {
    it('atualiza endereco do proprio usuario -> 200', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId, { label: 'Casa' });

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ label: 'Trabalho', complemento: 'Sala 2' });

        expect(res.status).toBe(200);
        expect(res.body.data.label).toBe('Trabalho');
        expect(res.body.data.complemento).toBe('Sala 2');
    });

    it('ao atualizar para principal desmarca os demais do usuario -> 200', async () => {
        const antigoPrincipal = await criarEnderecoUsuario(usuarioAuthId, {
            label: 'Casa',
            principal: true,
        });
        const novoPrincipal = await criarEnderecoUsuario(usuarioAuthId, {
            label: 'Trabalho',
            principal: false,
        });

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${novoPrincipal._id}`)
            .send({ principal: true });

        expect(res.status).toBe(200);
        expect(res.body.data.principal).toBe(true);

        const antigoAtualizado = await Endereco.findById(antigoPrincipal._id);
        expect(antigoAtualizado.principal).toBe(false);
    });

       it('nao permite alterar vinculo do endereco pelo payload -> 200', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId, { label: 'Casa' });

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ usuario_id: outroUsuarioId.toString(), restaurante_id: restauranteId.toString(), label: 'Casa Nova' });

        expect(res.status).toBe(200);
        expect(res.body.data.label).toBe('Casa Nova');
        expect(res.body.data.usuario_id).toBe(usuarioAuthId.toString());
        expect(res.body.data.restaurante_id).toBeNull();
    });

    it('label duplicado ao atualizar -> 409', async () => {
        await criarEnderecoUsuario(usuarioAuthId, { label: 'Casa' });
        const endereco = await criarEnderecoUsuario(usuarioAuthId, { label: 'Trabalho' });

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ label: 'Casa' });

        expect(res.status).toBe(409);
    });

    it('atualiza somente complemento sem mexer em label ou principal -> 200', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId, {
            label: 'Casa',
            principal: false,
        });

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ complemento: 'Bloco B' });

        expect(res.status).toBe(200);
        expect(res.body.data.complemento).toBe('Bloco B');
        expect(res.body.data.label).toBe('Casa');
        expect(res.body.data.principal).toBe(false);
    });

    it('endereco de outro usuario -> 403', async () => {
        const endereco = await criarEnderecoUsuario(outroUsuarioId, { label: 'Outro' });

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ label: 'Tentativa' });

        expect(res.status).toBe(403);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${INVALID_OBJECT_ID}`)
            .send({ label: 'Novo Nome' });

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId);

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ cep: '123' });

        expect(res.status).toBe(400);
    });

    it('corpo vazio -> 400', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId);

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId);
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`)
            .send({ label: 'Bloqueado' });

        expect(res.status).toBe(401);
    });

    it('endereco inexistente -> 404', async () => {
        const res = await request(app)
            .patch(`/api/usuarios/${usuarioAuthId}/enderecos/${NOT_FOUND_OBJECT_ID}`)
            .send({ label: 'Nao Existe' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /usuarios/:usuarioId/enderecos/:enderecoId', () => {
    it('deleta endereco do proprio usuario -> 200', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId);

        const res = await request(app).delete(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(200);

        const removido = await Endereco.findById(endereco._id);
        expect(removido).toBeNull();
    });

    it('endereco de outro usuario -> 403', async () => {
        const endereco = await criarEnderecoUsuario(outroUsuarioId);

        const res = await request(app).delete(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(403);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).delete(`/api/usuarios/${usuarioAuthId}/enderecos/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const endereco = await criarEnderecoUsuario(usuarioAuthId);
        asNaoAutenticado();

        const res = await request(app).delete(`/api/usuarios/${usuarioAuthId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(401);
    });

    it('endereco inexistente -> 404', async () => {
        const res = await request(app).delete(`/api/usuarios/${usuarioAuthId}/enderecos/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });
});
describe('GET /restaurantes/:restauranteId/enderecos', () => {
    it('busca endereco de restaurante em rota publica -> 200', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId, { label: 'Sede' });

        const res = await request(app).get(`/api/restaurantes/${restauranteId}/enderecos`);

        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(endereco._id.toString());
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());
    });

    it('retorna null quando restaurante nao possui endereco -> 200', async () => {
        const restauranteSemEnderecoId = await criarRestaurante(nextId('Restaurante Sem Endereco'), ownerId);

        const res = await request(app).get(`/api/restaurantes/${restauranteSemEnderecoId}/enderecos`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
    });

    it('restauranteId invalido -> 400', async () => {
        const res = await request(app).get(`/api/restaurantes/${INVALID_OBJECT_ID}/enderecos`);

        expect(res.status).toBe(400);
    });
});

describe('POST /restaurantes/:restauranteId/enderecos', () => {
    it('cria endereco como dono do restaurante -> 201', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post(`/api/restaurantes/${restauranteId}/enderecos`)
            .send(payloadEndereco({ label: 'Sede', principal: true }));

        expect(res.status).toBe(201);
        expect(res.body.data.label).toBe('Sede');
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());
        expect(res.body.data.usuario_id).toBeNull();
        expect(res.body.data.principal).toBe(false);

        tempEnderecos.push(res.body.data._id);
    });

    it('administrador cria endereco para restaurante -> 201', async () => {
        const restauranteAdminId = await criarRestaurante(nextId('Restaurante Admin'), ownerId);
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .post(`/api/restaurantes/${restauranteAdminId}/enderecos`)
            .send(payloadEndereco({ label: 'Sede Admin' }));

        expect(res.status).toBe(201);
        expect(res.body.data.restaurante_id).toBe(restauranteAdminId.toString());

        tempEnderecos.push(res.body.data._id);
    });

    
    it('restaurante com endereco existente -> 409', async () => {
        await criarEnderecoRestaurante(restauranteId, { label: 'Sede' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post(`/api/restaurantes/${restauranteId}/enderecos`)
            .send(payloadEndereco({ label: 'Filial' }));

        expect(res.status).toBe(409);
    });

    it('payload invalido -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post(`/api/restaurantes/${restauranteId}/enderecos`)
            .send(payloadEndereco({ rua: 'A' }));

        expect(res.status).toBe(400);
    });

    it('corpo vazio -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post(`/api/restaurantes/${restauranteId}/enderecos`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app)
            .post(`/api/restaurantes/${restauranteId}/enderecos`)
            .send(payloadEndereco());

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const res = await request(app)
            .post(`/api/restaurantes/${restauranteId}/enderecos`)
            .send(payloadEndereco());

        expect(res.status).toBe(403);
    });

    it('restaurante inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .post(`/api/restaurantes/${NOT_FOUND_OBJECT_ID}/enderecos`)
            .send(payloadEndereco());

        expect(res.status).toBe(404);
    });
});

describe('PATCH /restaurantes/:restauranteId/enderecos/:enderecoId', () => {
    it('atualiza endereco como dono do restaurante -> 200', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId, { label: 'Sede' });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({ label: 'Sede Nova', numero: '456' });

        expect(res.status).toBe(200);
        expect(res.body.data.label).toBe('Sede Nova');
        expect(res.body.data.numero).toBe('456');
    });

    it('nao permite alterar vinculo nem principal de endereco de restaurante -> 200', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId, { label: 'Sede', principal: false });
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({
                usuario_id: usuarioAuthId.toString(),
                restaurante_id: new ObjectId().toString(),
                principal: true,
                label: 'Sede Atualizada',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.label).toBe('Sede Atualizada');
        expect(res.body.data.usuario_id).toBeNull();
        expect(res.body.data.restaurante_id).toBe(restauranteId.toString());
        expect(res.body.data.principal).toBe(false);
    });

    it('endereco de outro restaurante -> 403', async () => {
        const outroRestauranteId = await criarRestaurante(nextId('Outro Restaurante'), ownerId);
        const endereco = await criarEnderecoRestaurante(outroRestauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({ label: 'Tentativa' });

        expect(res.status).toBe(403);
    });

    it('id invalido -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${INVALID_OBJECT_ID}`)
            .send({ label: 'Novo Nome' });

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({ estado: 'ROO' });

        expect(res.status).toBe(400);
    });

    it('corpo vazio -> 400', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({ label: 'Bloqueado' });

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`)
            .send({ label: 'Sem Permissao' });

        expect(res.status).toBe(403);
    });

    it('endereco inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app)
            .patch(`/api/restaurantes/${restauranteId}/enderecos/${NOT_FOUND_OBJECT_ID}`)
            .send({ label: 'Nao Existe' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /restaurantes/:restauranteId/enderecos/:enderecoId', () => {
    it('deleta endereco como dono do restaurante -> 200', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(200);

        const removido = await Endereco.findById(endereco._id);
        expect(removido).toBeNull();
    });

    it('endereco de outro restaurante -> 403', async () => {
        const outroRestauranteId = await criarRestaurante(nextId('Outro Restaurante Delete'), ownerId);
        const endereco = await criarEnderecoRestaurante(outroRestauranteId);
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(403);
    });

    it('id invalido -> 400', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/restaurantes/${restauranteId}/enderecos/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);
        asNaoAutenticado();

        const res = await request(app).delete(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const endereco = await criarEnderecoRestaurante(restauranteId);

        const res = await request(app).delete(`/api/restaurantes/${restauranteId}/enderecos/${endereco._id}`);

        expect(res.status).toBe(403);
    });

    it('endereco inexistente -> 404', async () => {
        autenticarComoUmaVez(ownerId);

        const res = await request(app).delete(`/api/restaurantes/${restauranteId}/enderecos/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });
});