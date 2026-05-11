jest.mock('../../middlewares/AuthMiddleware.js');

jest.mock('../../middlewares/RateLimitMiddleware.js', () => ({
    strictRateLimit: (req, res, next) => next(),
}));

jest.mock('../../service/EmailService.js', () => ({
    __esModule: true,
    default: {
        enviarEmailRecuperacao: jest.fn().mockResolvedValue(true),
        enviarEmailVerificacao: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../../service/UsuarioService.js', () => ({
    __esModule: true,
    default: class {
        async criar(data) {
            return {
                toObject: () => ({
                    _id: '123',
                    ...data,
                    isAdmin: false,
                }),
            };
        }
    }
}));

jest.mock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        verifyIdToken: jest.fn(),
    })),
}));

import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from '@jest/globals';

import authRoutes from '../../routes/authRoutes.js';
import Usuario from '../../models/Usuario.js';
import AuthService from '../../service/AuthService.js';
import errorHandler from '../../utils/helpers/errorHandler.js';

const RUN_ID = Date.now().toString(36);

let app;
let mongoServer;

let warnSpy;
let errorSpy;
let logSpy;

let sequence = 0;

const usuariosTemp = [];

function nextId(prefix = 'item') {
    sequence += 1;
    return `${prefix}-${RUN_ID}-${sequence}`;
}

async function criarUsuario(extra = {}) {
    const senha = extra.senha === null
        ? null
        : await bcrypt.hash(extra.senha || 'Senha@123', 10);

    const usuario = await Usuario.create({
        nome: nextId('Usuario'),
        email: `${nextId('mail')}@test.local`,
        senha,
        status: 'ativo',
        email_verificado: true,
        authProvider: 'local',
        profileComplete: false,
        refreshtoken: null,
        ...extra,
    });

    usuariosTemp.push(usuario._id);

    return usuario;
}

beforeAll(async () => {
    process.env.JWT_SECRET_ACCESS_TOKEN = 'jwt-access-test';
    process.env.JWT_SECRET_REFRESH_TOKEN = 'jwt-refresh-test';
    process.env.JWT_SECRET_RECOVER_PASSWORD = 'jwt-recover-test';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    app = express();

    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
}, 30000);

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(async () => {
    if (usuariosTemp.length > 0) {
        await Usuario.deleteMany({
            _id: { $in: usuariosTemp },
        }).catch(() => {});

        usuariosTemp.length = 0;
    }
});

afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }

    warnSpy?.mockRestore();
    errorSpy?.mockRestore();
    logSpy?.mockRestore();
}, 30000);

describe('POST /api/auth/login', () => {
    it('realiza login com credenciais válidas -> 200', async () => {
        const usuario = await criarUsuario();

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'Senha@123',
            });

        expect(res.status).toBe(200);

        expect(res.body.data.user).toHaveProperty('accessToken');
        expect(res.body.data.user).toHaveProperty('refreshtoken');

        expect(res.body.data.user.email).toBe(usuario.email);
    });

    it('email inexistente -> 401', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'naoexiste@test.local',
                senha: 'Senha@123',
            });

        expect(res.status).toBe(401);
    });

    it('senha inválida -> 401', async () => {
        const usuario = await criarUsuario();

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'SenhaErrada@123',
            });

        expect(res.status).toBe(401);
    });

    it('usuário inativo -> 403', async () => {
        const usuario = await criarUsuario({
            status: 'inativo',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'Senha@123',
            });

        expect(res.status).toBe(403);
    });

    it('email não verificado -> 403', async () => {
        const usuario = await criarUsuario({
            email_verificado: false,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'Senha@123',
            });

        expect(res.status).toBe(403);
    });

    it('conta google-only -> 401', async () => {
        const usuario = await criarUsuario({
            senha: null,
            authProvider: 'google',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'Senha@123',
            });

        expect(res.status).toBe(401);
    });

    it('payload inválido -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/logout', () => {
    it('realiza logout com token válido -> 200', async () => {
        const usuario = await criarUsuario();

        const token = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_ACCESS_TOKEN,
        );

        const res = await request(app)
            .post('/api/auth/logout')
            .send({
                access_token: token,
            });

        expect(res.status).toBe(200);
    });

    it('sem token -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .send({});

        expect(res.status).toBe(400);
    });

    it('token inválido -> 500', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .send({
                access_token: 'token-invalido',
            });

        expect(res.status).toBe(500);
    });
});

describe('POST /api/auth/refresh', () => {
    it('gera novo access token -> 200', async () => {
        const usuario = await criarUsuario();

        const refreshToken = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_REFRESH_TOKEN,
        );

        await Usuario.findByIdAndUpdate(usuario._id, {
            refreshtoken: refreshToken,
        });

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({
                refresh_token: refreshToken,
            });

        expect(res.status).toBe(200);

        expect(res.body.data.user).toHaveProperty('accesstoken');
        expect(res.body.data.user).toHaveProperty('refreshtoken');
    });

    it('refresh token ausente -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({});

        expect(res.status).toBe(400);
    });

    it('refresh token inválido -> 500', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({
                refresh_token: 'token-invalido',
            });

        expect(res.status).toBe(500);
    });
});

describe('POST /api/auth/recover', () => {
    it('envia email de recuperação -> 200', async () => {
        const usuario = await criarUsuario();

        const res = await request(app)
            .post('/api/auth/recover')
            .send({
                email: usuario.email,
            });

        expect(res.status).toBe(200);
    });

    it('email inválido -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/recover')
            .send({
                email: 'email-invalido',
            });

        expect(res.status).toBe(400);
    });

    it('email inexistente -> 404', async () => {
        const res = await request(app)
            .post('/api/auth/recover')
            .send({
                email: 'naoexiste@test.local',
            });

        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/auth/password/reset', () => {
    it('atualiza senha com token válido -> 200', async () => {
        await criarUsuario({
            tokenUnico: 'token-recuperacao',
            exp_codigo_recupera_senha: new Date(Date.now() + 100000),
        });

        const res = await request(app)
            .patch('/api/auth/password/reset?token=token-recuperacao')
            .send({
                senha: 'NovaSenha@123',
            });

        expect(res.status).toBe(200);
    });

    it('sem token -> 401', async () => {
        const res = await request(app)
            .patch('/api/auth/password/reset')
            .send({
                senha: 'NovaSenha@123',
            });

        expect(res.status).toBe(401);
    });

    it('sem senha -> 400', async () => {
        const res = await request(app)
            .patch('/api/auth/password/reset?token=abc')
            .send({});

        expect(res.status).toBe(400);
    });

    it('token inválido -> 404', async () => {
        const res = await request(app)
            .patch('/api/auth/password/reset?token=invalido')
            .send({
                senha: 'NovaSenha@123',
            });

        expect(res.status).toBe(404);
    });
});

describe('POST /api/auth/signup', () => {
    it('cria usuário -> 201', async () => {
        const payload = {
            nome: 'Usuário Cadastro',
            email: `${nextId('signup')}@test.local`,
            senha: 'Senha@123',
            cpf: '08573215099',
            telefone: '69999998888',
        };

        const res = await request(app)
            .post('/api/auth/signup')
            .send(payload);

        expect(res.status).toBe(201);

        expect(res.body.data.email).toBe(payload.email);

        expect(res.body.data.isAdmin).toBe(false);
    });

    it('payload inválido -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('GET /api/auth/verificar-email', () => {
    it('sem token -> 400', async () => {
        const res = await request(app)
            .get('/api/auth/verificar-email');

        expect(res.status).toBe(400);
    });

    it('token inválido -> 400', async () => {
        jest.spyOn(AuthService.prototype, 'verificarEmail')
            .mockRejectedValue(new Error('Token inválido'));

        const res = await request(app)
            .get('/api/auth/verificar-email?token=invalido');

        expect(res.status).toBe(400);
    });

    it('verifica email com sucesso -> 200', async () => {
        jest.spyOn(AuthService.prototype, 'verificarEmail')
            .mockResolvedValue({
                message: 'Email verificado',
            });

        const res = await request(app)
            .get('/api/auth/verificar-email?token=valido');

        expect(res.status).toBe(200);
    });
});

describe('POST /api/auth/google', () => {
    it('payload inválido -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({});

        expect(res.status).toBe(400);
    });

    it('login google com sucesso -> 200', async () => {
        jest.spyOn(AuthService.prototype, 'loginWithGoogle')
            .mockResolvedValue({
                user: {
                    accessToken: 'access-token',
                    refreshtoken: 'refresh-token',
                    email: 'google@test.local',
                },
            });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(200);

        expect(res.body.data.user.email).toBe('google@test.local');
    });
});