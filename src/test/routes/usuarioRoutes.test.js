jest.mock('../../middlewares/AuthMiddleware.js');
jest.mock('../../service/UploadService.js', () => ({
    __esModule: true,
    default: class {
        constructor() {}
        async substituirImagem() {
            return {
                url: 'http://test.com/usuario.jpg',
                fileName: 'usuario.jpg',
                metadata: { contentType: 'image/jpeg' },
            };
        }
        async deleteImagemComRetry() {
            return true;
        }
    },
}));
jest.mock('../../service/EmailService.js', () => ({
    __esModule: true,
    default: {
        enviarEmailVerificacao: jest.fn().mockResolvedValue({ messageId: 'email-test' }),
        enviarEmailRecuperacao: jest.fn().mockResolvedValue({ messageId: 'email-test' }),
    },
}));

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import { cpf as cpfUtil } from 'cpf-cnpj-validator';
import express from 'express';
import expressFileUpload from 'express-fileupload';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import EmailService from '../../service/EmailService.js';
import UsuarioService from '../../service/UsuarioService.js';
import UsuarioRepository from '../../repository/UsuarioRepository.js';
import UsuarioFilterBuild from '../../repository/filters/UsuarioFilterBuild.js';
import Usuario from '../../models/Usuario.js';
import { UsuarioStatusUpdateSchema } from '../../utils/validators/schemas/zod/UsuarioSchema.js';
import { UsuarioQuerySchema } from '../../utils/validators/schemas/zod/querys/UsuarioQuerySchema.js';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;
let adminId;
let usuarioAuthId;
let outroUsuarioId;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const INVALID_OBJECT_ID = 'nao-e-objectid';
const NOT_FOUND_OBJECT_ID = new ObjectId().toString();

const seedUsuarios = [];
const tempUsuarios = [];

function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

function gerarCpf() {
    return cpfUtil.generate(false);
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
            message: 'Nao autorizado. Faca login para continuar.',
            data: null,
            errors: [],
        });
    });
}

async function criarUsuario(nome, extra = {}, { seed = false } = {}) {
    const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const usuario = await Usuario.create({
        nome,
        email: `${slug}-${nextId('mail')}@test.local`,
        senha: 'teste123',
        status: 'ativo',
        isAdmin: false,
        foto_perfil: '',
        ...extra,
    });

    if (seed) {
        seedUsuarios.push(usuario._id);
    } else {
        tempUsuarios.push(usuario._id);
    }

    return usuario;
}

function payloadUsuario(extra = {}) {
    return {
        nome: nextId('UsuarioPayload'),
        email: `${nextId('usuario')}@test.local`,
        senha: 'Senha@123',
        cpf: gerarCpf(),
        telefone: '11987654321',
        foto_perfil: 'http://test.com/perfil.png',
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
    app.use('/api', usuarioRoutes);
    app.use(errorHandler);

    const admin = await criarUsuario('Admin Usuario', { isAdmin: true }, { seed: true });
    const usuarioAuth = await criarUsuario('Usuario Auth', {}, { seed: true });
    const outroUsuario = await criarUsuario('Outro Usuario', {}, { seed: true });

    adminId = admin._id;
    usuarioAuthId = usuarioAuth._id;
    outroUsuarioId = outroUsuario._id;

    asAutenticado();
}, 30000);

afterEach(async () => {
    if (tempUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: tempUsuarios } }).catch(() => {});
        tempUsuarios.length = 0;
    }

    asAutenticado();
});

afterAll(async () => {
    if (tempUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: tempUsuarios } }).catch(() => {});
    }

    if (seedUsuarios.length > 0) {
        await Usuario.deleteMany({ _id: { $in: seedUsuarios } }).catch(() => {});
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


describe('GET /usuarios', () => {
    it('lista usuarios autenticados em ordem alfabetica com paginacao padrao -> 200', async () => {
        await criarUsuario('Zeta Usuario');
        await criarUsuario('Alpha Usuario');

        const res = await request(app).get('/api/usuarios');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data.totalDocs).toBeGreaterThanOrEqual(5);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10);
        expect(res.body.data.docs.map(usuario => usuario.nome)).toEqual(
            [...res.body.data.docs.map(usuario => usuario.nome)].sort(),
        );
    });

    it('filtra por nome, email, status, cpf, telefone e isAdmin -> 200', async () => {
        const cpf = gerarCpf();
        await criarUsuario('Filtro Usuario', {
            email: 'filtro.usuario@test.local',
            cpf,
            telefone: '11999998888',
            status: 'ativo',
            isAdmin: true,
        });
        await criarUsuario('Outro Filtro', {
            email: 'outro.filtro@test.local',
            cpf: gerarCpf(),
            telefone: '21999998888',
            status: 'inativo',
            isAdmin: false,
        });

        const res = await request(app)
            .get(`/api/usuarios?nome=Filtro&email=filtro.usuario@test.local&status=ativo&cpf=${cpf}&telefone=11999998888&isAdmin=true`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(1);
        expect(res.body.data.docs[0].email).toBe('filtro.usuario@test.local');
        expect(res.body.data.docs[0].isAdmin).toBe(true);
    });

    it('respeita paginacao customizada -> 200', async () => {
        await criarUsuario('Paginado A');
        await criarUsuario('Paginado B');

        const res = await request(app).get('/api/usuarios?page=2&limite=1');

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.limit).toBe(1);
        expect(res.body.data.docs).toHaveLength(1);
    });

    it('retorna mensagem de nenhum usuario com filtros sem resultado -> 200', async () => {
        const res = await request(app).get('/api/usuarios?nome=NaoExisteUsuario');

        expect(res.status).toBe(200);
        expect(res.body.data.totalDocs).toBe(0);
        expect(res.body.message).toContain('filtros');
    });

    it('query invalida -> 400', async () => {
        const res = await request(app).get('/api/usuarios?page=0');

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get('/api/usuarios');

        expect(res.status).toBe(401);
    });
});

describe('GET /usuarios/:id', () => {
    it('busca usuario por id autenticado -> 200', async () => {
        const usuario = await criarUsuario('Detalhe Usuario');

        const res = await request(app).get(`/api/usuarios/${usuario._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(usuario._id.toString());
        expect(res.body.data.nome).toBe('Detalhe Usuario');
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).get(`/api/usuarios/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('usuario inexistente -> 404', async () => {
        const res = await request(app).get(`/api/usuarios/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app).get(`/api/usuarios/${usuarioAuthId}`);

        expect(res.status).toBe(401);
    });
});

describe('POST /usuarios', () => {
    it('cria usuario autenticado removendo senha da resposta -> 201', async () => {
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadUsuario({ nome: 'Novo Usuario' }));

        expect(res.status).toBe(201);
        expect(res.body.data.nome).toBe('Novo Usuario');
        expect(res.body.data.email_verificado).toBe(false);
        expect(res.body.data).not.toHaveProperty('senha');

        tempUsuarios.push(res.body.data._id);
    });

    it('cria usuario sem senha opcional -> 201', async () => {
        const { senha, ...payloadSemSenha } = payloadUsuario({ nome: 'Sem Senha' });

        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadSemSenha);

        expect(res.status).toBe(201);
        expect(res.body.data.nome).toBe('Sem Senha');

        tempUsuarios.push(res.body.data._id);
    });

    it('corpo vazio -> 400', async () => {
        const res = await request(app).post('/api/usuarios').send({});

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadUsuario({ email: 'email-invalido', senha: 'fraca' }));

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        asNaoAutenticado();

        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadUsuario());

        expect(res.status).toBe(401);
    });

    it('email duplicado -> 400', async () => {
        await criarUsuario('Email Duplicado', { email: 'duplicado@test.local' });

        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadUsuario({ email: 'duplicado@test.local' }));

        expect(res.status).toBe(400);
    });

    it('cpf invalido -> 400', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadUsuario({ cpf: '11111111111' }));

        expect(res.status).toBe(400);
    });

    it('cpf duplicado -> 400', async () => {
        const cpf = gerarCpf();
        await criarUsuario('CPF Duplicado', { cpf });

        const res = await request(app)
            .post('/api/usuarios')
            .send(payloadUsuario({ cpf }));

        expect(res.status).toBe(400);
    });
});
describe('PATCH /usuarios/:id', () => {
    it('atualiza proprio usuario e marca perfil completo com cpf e telefone -> 200', async () => {
        const usuario = await criarUsuario('Atualizavel', { profileComplete: false });
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({ nome: 'Atualizado', cpf: gerarCpf(), telefone: '11987654321' });

        expect(res.status).toBe(200);
        expect(res.body.data.nome).toBe('Atualizado');
        expect(res.body.data.profileComplete).toBe(true);
        expect(res.body.data).not.toHaveProperty('senha');
    });

    it('administrador atualiza outro usuario e pode alterar isAdmin -> 200', async () => {
        const usuario = await criarUsuario('Usuario Promovido');
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({ isAdmin: true, nome: 'Usuario Admin' });

        expect(res.status).toBe(200);
        expect(res.body.data.isAdmin).toBe(true);
        expect(res.body.data.nome).toBe('Usuario Admin');
    });

    it('usuario comum nao altera isAdmin nem senha pela rota de perfil -> 200', async () => {
        const usuario = await criarUsuario('Usuario Comum');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({ isAdmin: true, senha: 'Outra@123', nome: 'Usuario Comum Editado' });

        expect(res.status).toBe(200);
        expect(res.body.data.isAdmin).toBe(false);
        expect(res.body.data.nome).toBe('Usuario Comum Editado');

        const usuarioComSenha = await Usuario.findById(usuario._id).select('+senha');
        expect(usuarioComSenha.senha).toBe('teste123');
    });

    it('corpo vazio -> 400', async () => {
        const usuario = await criarUsuario('Corpo Vazio');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app)
            .patch(`/api/usuarios/${INVALID_OBJECT_ID}`)
            .send({ nome: 'Novo Nome' });

        expect(res.status).toBe(400);
    });

    it('payload invalido -> 400', async () => {
        const usuario = await criarUsuario('Payload Invalido');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({ foto_perfil: 'arquivo.txt' });

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const usuario = await criarUsuario('Sem Auth');
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({ nome: 'Bloqueado' });

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao para atualizar outro -> 403', async () => {
        const usuario = await criarUsuario('Outro Atualizavel');

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}`)
            .send({ nome: 'Sem Permissao' });

        expect(res.status).toBe(403);
    });

    it('usuario inexistente -> 404', async () => {
        const res = await request(app)
            .patch(`/api/usuarios/${NOT_FOUND_OBJECT_ID}`)
            .send({ nome: 'Nao Existe' });

        expect(res.status).toBe(404);
    });
});
describe('PATCH /usuarios/:id/status', () => {
    it('administrador altera status de outro usuario -> 200', async () => {
        const usuario = await criarUsuario('Status Usuario');
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}/status`)
            .send({ status: 'inativo' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('inativo');
    });

    it('usuario altera o proprio status -> 200', async () => {
        const usuario = await criarUsuario('Status Proprio');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}/status`)
            .send({ status: 'inativo' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('inativo');
    });

    it('status invalido -> 400', async () => {
        const usuario = await criarUsuario('Status Invalido');
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}/status`)
            .send({ status: 'bloqueado' });

        expect(res.status).toBe(400);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app)
            .patch(`/api/usuarios/${INVALID_OBJECT_ID}/status`)
            .send({ status: 'inativo' });

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const usuario = await criarUsuario('Status Sem Auth');
        asNaoAutenticado();

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}/status`)
            .send({ status: 'inativo' });

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao para alterar outro -> 403', async () => {
        const usuario = await criarUsuario('Status Outro');

        const res = await request(app)
            .patch(`/api/usuarios/${usuario._id}/status`)
            .send({ status: 'inativo' });

        expect(res.status).toBe(403);
    });

    it('usuario inexistente -> 404', async () => {
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .patch(`/api/usuarios/${NOT_FOUND_OBJECT_ID}/status`)
            .send({ status: 'inativo' });

        expect(res.status).toBe(404);
    });
});
describe('DELETE /usuarios/:id', () => {
    it('deleta propria conta -> 200', async () => {
        const usuario = await criarUsuario('Delete Proprio', { foto_perfil: 'http://test.com/antiga.jpg' });
        autenticarComoUmaVez(usuario._id);

        const res = await request(app).delete(`/api/usuarios/${usuario._id}`);

        expect(res.status).toBe(200);

        const removido = await Usuario.findById(usuario._id);
        expect(removido).toBeNull();
    });

    it('administrador deleta outro usuario -> 200', async () => {
        const usuario = await criarUsuario('Delete Admin');
        autenticarComoUmaVez(adminId);

        const res = await request(app).delete(`/api/usuarios/${usuario._id}`);

        expect(res.status).toBe(200);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).delete(`/api/usuarios/${INVALID_OBJECT_ID}`);

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const usuario = await criarUsuario('Delete Sem Auth');
        asNaoAutenticado();

        const res = await request(app).delete(`/api/usuarios/${usuario._id}`);

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao para deletar outro -> 403', async () => {
        const usuario = await criarUsuario('Delete Outro');

        const res = await request(app).delete(`/api/usuarios/${usuario._id}`);

        expect(res.status).toBe(403);
    });

    it('usuario inexistente -> 404', async () => {
        const res = await request(app).delete(`/api/usuarios/${NOT_FOUND_OBJECT_ID}`);

        expect(res.status).toBe(404);
    });
});

describe('POST /usuarios/:id/foto', () => {
    it('atualiza foto do proprio usuario -> 200', async () => {
        const usuario = await criarUsuario('Foto Propria');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .post(`/api/usuarios/${usuario._id}/foto`)
            .attach('file', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(200);
        expect(res.body.data.dados.foto_perfil).toBe('http://test.com/usuario.jpg');

        const atualizado = await Usuario.findById(usuario._id);
        expect(atualizado.foto_perfil).toBe('http://test.com/usuario.jpg');
    });

    it('aceita arquivo no campo imagem -> 200', async () => {
        const usuario = await criarUsuario('Foto Imagem');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app)
            .post(`/api/usuarios/${usuario._id}/foto`)
            .attach('imagem', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(200);
        expect(res.body.data.dados.foto_perfil).toBe('http://test.com/usuario.jpg');
    });

    it('administrador atualiza foto de outro usuario -> 200', async () => {
        const usuario = await criarUsuario('Foto Admin');
        autenticarComoUmaVez(adminId);

        const res = await request(app)
            .post(`/api/usuarios/${usuario._id}/foto`)
            .attach('file', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(200);
    });

    it('sem arquivo -> 400', async () => {
        const usuario = await criarUsuario('Foto Sem Arquivo');
        autenticarComoUmaVez(usuario._id);

        const res = await request(app).post(`/api/usuarios/${usuario._id}/foto`);

        expect(res.status).toBe(400);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app)
            .post(`/api/usuarios/${INVALID_OBJECT_ID}/foto`)
            .attach('file', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const usuario = await criarUsuario('Foto Sem Auth');
        asNaoAutenticado();

        const res = await request(app)
            .post(`/api/usuarios/${usuario._id}/foto`)
            .attach('file', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const usuario = await criarUsuario('Foto Outro');

        const res = await request(app)
            .post(`/api/usuarios/${usuario._id}/foto`)
            .attach('file', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(403);
    });

    it('usuario inexistente -> 404', async () => {
        const res = await request(app)
            .post(`/api/usuarios/${NOT_FOUND_OBJECT_ID}/foto`)
            .attach('file', Buffer.from('fake-image'), 'usuario.jpg');

        expect(res.status).toBe(404);
    });
});

describe('DELETE /usuarios/:id/foto', () => {
    it('remove foto do proprio usuario -> 200', async () => {
        const usuario = await criarUsuario('Remove Foto', { foto_perfil: 'http://test.com/antiga.jpg' });
        autenticarComoUmaVez(usuario._id);

        const res = await request(app).delete(`/api/usuarios/${usuario._id}/foto`);

        expect(res.status).toBe(200);

        const atualizado = await Usuario.findById(usuario._id);
        expect(atualizado.foto_perfil).toBe('');
    });

    it('administrador remove foto de outro usuario -> 200', async () => {
        const usuario = await criarUsuario('Remove Foto Admin', { foto_perfil: 'http://test.com/antiga.jpg' });
        autenticarComoUmaVez(adminId);

        const res = await request(app).delete(`/api/usuarios/${usuario._id}/foto`);

        expect(res.status).toBe(200);
    });

    it('usuario sem foto -> 404', async () => {
        const usuario = await criarUsuario('Sem Foto', { foto_perfil: '' });
        autenticarComoUmaVez(usuario._id);

        const res = await request(app).delete(`/api/usuarios/${usuario._id}/foto`);

        expect(res.status).toBe(404);
    });

    it('id invalido -> 400', async () => {
        const res = await request(app).delete(`/api/usuarios/${INVALID_OBJECT_ID}/foto`);

        expect(res.status).toBe(400);
    });

    it('sem autenticacao -> 401', async () => {
        const usuario = await criarUsuario('Remove Foto Sem Auth', { foto_perfil: 'http://test.com/antiga.jpg' });
        asNaoAutenticado();

        const res = await request(app).delete(`/api/usuarios/${usuario._id}/foto`);

        expect(res.status).toBe(401);
    });

    it('usuario sem permissao -> 403', async () => {
        const usuario = await criarUsuario('Remove Foto Outro', { foto_perfil: 'http://test.com/antiga.jpg' });

        const res = await request(app).delete(`/api/usuarios/${usuario._id}/foto`);

        expect(res.status).toBe(403);
    });

    it('usuario inexistente -> 404', async () => {
        const res = await request(app).delete(`/api/usuarios/${NOT_FOUND_OBJECT_ID}/foto`);

        expect(res.status).toBe(404);
    });
});

describe('UsuarioService - ramos internos', () => {
    it('criar nao falha quando envio de email em background rejeita', async () => {
        const service = new UsuarioService();
        service.validateEmail = jest.fn().mockResolvedValue();
        service.validateCpf = jest.fn().mockResolvedValue();
        service.repository = {
            criar: jest.fn().mockResolvedValue({
                nome: 'Email Background',
                email: 'background@test.local',
            }),
        };
        EmailService.enviarEmailVerificacao.mockRejectedValueOnce(new Error('smtp off'));

        const data = await service.criar({
            nome: 'Email Background',
            email: 'background@test.local',
            senha: 'Senha@123',
        });
        await new Promise(resolve => setImmediate(resolve));

        expect(data.email).toBe('background@test.local');
        expect(EmailService.enviarEmailVerificacao).toHaveBeenCalled();
    });

    it('deletar registra falhas de limpeza em cascata sem bloquear retorno', async () => {
        const service = new UsuarioService();
        service.ensureUserExists = jest.fn().mockResolvedValue({ _id: usuarioAuthId });
        service.repository = {
            buscarPorID: jest.fn().mockResolvedValue({ _id: usuarioAuthId, isAdmin: false }),
            deletar: jest.fn().mockResolvedValue({ _id: usuarioAuthId, foto_perfil: 'foto.jpg' }),
        };
        service.enderecoRepository = {
            deletarPorUsuario: jest.fn().mockRejectedValue(new Error('endereco')),
        };
        service.notificacaoRepository = {
            deletarPorUsuario: jest.fn().mockRejectedValue(new Error('notificacao')),
        };
        service.pedidoRepository = {
            removerVinculosCliente: jest.fn().mockRejectedValue(new Error('pedido')),
        };
        service.uploadService = {
            deleteImagemComRetry: jest.fn().mockRejectedValue(new Error('foto')),
        };

        const data = await service.deletar(usuarioAuthId, { user_id: usuarioAuthId });
        await new Promise(resolve => setImmediate(resolve));

        expect(data.foto_perfil).toBe('foto.jpg');
        expect(service.pedidoRepository.removerVinculosCliente).toHaveBeenCalledWith(usuarioAuthId);
        expect(service.uploadService.deleteImagemComRetry).toHaveBeenCalledWith('foto.jpg');
    });

    it('fotoDelete registra falha de exclusao em background sem bloquear retorno', async () => {
        const service = new UsuarioService();
        service.ensureUserExists = jest.fn().mockResolvedValue({
            _id: usuarioAuthId,
            foto_perfil: 'foto.jpg',
        });
        service.repository = {
            buscarPorID: jest.fn().mockResolvedValue({ _id: usuarioAuthId, isAdmin: false }),
            atualizar: jest.fn().mockResolvedValue({}),
        };
        service.uploadService = {
            deleteImagemComRetry: jest.fn().mockRejectedValue(new Error('foto')),
        };

        await expect(service.fotoDelete(usuarioAuthId, { user_id: usuarioAuthId }))
            .resolves
            .toBe(true);
        await new Promise(resolve => setImmediate(resolve));

        expect(service.repository.atualizar).toHaveBeenCalledWith(usuarioAuthId, { foto_perfil: '' });
    });

    it('ensureUserExists retorna 404 quando repository devolve nulo', async () => {
        const service = new UsuarioService();
        service.repository = {
            buscarPorID: jest.fn().mockResolvedValue(null),
        };

        await expect(service.ensureUserExists(NOT_FOUND_OBJECT_ID))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });
});

describe('UsuarioRepository e filtros - ramos internos', () => {
    function querySelect(resultado) {
        return {
            select: jest.fn().mockResolvedValue(resultado),
        };
    }

    it('armazenarTokens retorna 401 quando usuario nao existe', async () => {
        const repository = new UsuarioRepository({
            usuarioModel: {
                findById: jest.fn().mockResolvedValue(null),
            },
        });

        await expect(repository.armazenarTokens(NOT_FOUND_OBJECT_ID, 'access', 'refresh'))
            .rejects
            .toMatchObject({
                statusCode: 401,
            });
    });

    it('removerTokens retorna 404 quando usuario nao existe', async () => {
        const exec = jest.fn().mockResolvedValue(null);
        const repository = new UsuarioRepository({
            usuarioModel: {
                findByIdAndUpdate: jest.fn(() => ({ exec })),
            },
        });

        await expect(repository.removerTokens(NOT_FOUND_OBJECT_ID))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });

    it('buscarPorEmail aplica idIgnorado', async () => {
        const findOne = jest.fn(() => querySelect({ email: 'teste@test.local' }));
        const repository = new UsuarioRepository({
            usuarioModel: { findOne },
        });

        const data = await repository.buscarPorEmail('teste@test.local', usuarioAuthId);

        expect(data.email).toBe('teste@test.local');
        expect(findOne).toHaveBeenCalledWith({
            email: 'teste@test.local',
            _id: { $ne: usuarioAuthId },
        });
    });

    it('buscarPorCpf aplica idIgnorado', async () => {
        const findOne = jest.fn(() => querySelect({ cpf: '12345678901' }));
        const repository = new UsuarioRepository({
            usuarioModel: { findOne },
        });

        const data = await repository.buscarPorCpf('12345678901', usuarioAuthId);

        expect(data.cpf).toBe('12345678901');
        expect(findOne).toHaveBeenCalledWith({
            cpf: '12345678901',
            _id: { $ne: usuarioAuthId },
        });
    });

    it('atualizar retorna 404 quando usuario nao existe', async () => {
        const repository = new UsuarioRepository({
            usuarioModel: {
                findByIdAndUpdate: jest.fn().mockResolvedValue(null),
            },
        });

        await expect(repository.atualizar(NOT_FOUND_OBJECT_ID, { nome: 'Novo' }))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });

    it('atualizarSenha retorna 404 quando usuario nao existe', async () => {
        const repository = new UsuarioRepository({
            usuarioModel: {
                findByIdAndUpdate: jest.fn().mockResolvedValue(null),
            },
        });

        await expect(repository.atualizarSenha(NOT_FOUND_OBJECT_ID, 'hash'))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });

    it('atualizarVerificacaoEmail retorna 404 quando usuario nao existe', async () => {
        const repository = new UsuarioRepository({
            usuarioModel: {
                findByIdAndUpdate: jest.fn().mockResolvedValue(null),
            },
        });

        await expect(repository.atualizarVerificacaoEmail(NOT_FOUND_OBJECT_ID))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });

    it('atualizarTokenVerificacao retorna 404 quando usuario nao existe', async () => {
        const repository = new UsuarioRepository({
            usuarioModel: {
                findByIdAndUpdate: jest.fn().mockResolvedValue(null),
            },
        });

        await expect(repository.atualizarTokenVerificacao(NOT_FOUND_OBJECT_ID, 'token', new Date()))
            .rejects
            .toMatchObject({
                statusCode: 404,
            });
    });

    it('UsuarioFilterBuild interpreta isAdmin numerico', () => {
        const filtros = new UsuarioFilterBuild()
            .comIsAdmin(1)
            .build();

        expect(filtros.isAdmin).toBe(true);
    });

    it('UsuarioQuerySchema converte isAdmin false textual', async () => {
        const parsed = await UsuarioQuerySchema.parseAsync({ isAdmin: 'false' });

        expect(parsed.isAdmin).toBe(false);
    });

    it('UsuarioStatusUpdateSchema preserva mensagem customizada de status invalido', () => {
        const mensagem = UsuarioStatusUpdateSchema.shape.status._def.errorMap().message;

        expect(mensagem).toContain('ativo');
        expect(mensagem).toContain('inativo');
    });
});
