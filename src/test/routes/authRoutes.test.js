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

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        verifyIdToken: (...args) => mockVerifyIdToken(...args),
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
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import AuthController from '../../controllers/AuthController.js';
import Usuario from '../../models/Usuario.js';
import AuthService from '../../service/AuthService.js';
import errorHandler from '../../utils/helpers/errorHandler.js';
import AuthenticationError from '../../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../../utils/errors/TokenExpiredError.js';
import CustomError from '../../utils/helpers/CustomError.js';

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

function criarReqMiddleware(authorization) {
    return {
        headers: authorization ? { authorization } : {},
    };
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
    mockVerifyIdToken.mockReset();
});

afterEach(async () => {
    if (usuariosTemp.length > 0) {
        await Usuario.deleteMany({
            _id: { $in: usuariosTemp },
        }).catch(() => {});

        usuariosTemp.length = 0;
    }

    await Usuario.deleteMany({
        email: { $regex: /@test\.local$/ },
    }).catch(() => {});

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

    it('mantém refresh token válido já cadastrado no login -> 200', async () => {
        const usuario = await criarUsuario({
            cpf: '08573215099',
            telefone: '69999998888',
            profileComplete: false,
        });

        const refreshToken = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_REFRESH_TOKEN,
        );

        await Usuario.findByIdAndUpdate(usuario._id, {
            refreshtoken: refreshToken,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email.toUpperCase(),
                senha: 'Senha@123',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.user.refreshtoken).toBe(refreshToken);
        expect(res.body.data.user.profileComplete).toBe(true);
    });

    it('renova refresh token expirado durante o login -> 200', async () => {
        const usuario = await criarUsuario();

        const refreshTokenExpirado = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_REFRESH_TOKEN,
            { expiresIn: '-1s' },
        );

        await Usuario.findByIdAndUpdate(usuario._id, {
            refreshtoken: refreshTokenExpirado,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'Senha@123',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.user.refreshtoken).not.toBe(refreshTokenExpirado);
    });

    it('falha quando refresh token salvo tem erro inesperado de validação -> 500', async () => {
        const usuario = await criarUsuario();

        const refreshTokenNaoAtivo = jwt.sign(
            { id: usuario._id.toString(), nbf: Math.floor(Date.now() / 1000) + 60 },
            process.env.JWT_SECRET_REFRESH_TOKEN,
        );

        await Usuario.findByIdAndUpdate(usuario._id, {
            refreshtoken: refreshTokenNaoAtivo,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: usuario.email,
                senha: 'Senha@123',
            });

        expect(res.status).toBe(500);
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

    it('realiza logout com token enviado no header Authorization -> 200', async () => {
        const usuario = await criarUsuario();

        const token = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_ACCESS_TOKEN,
        );

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(200);
    });

    it('sem token -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .send({});

        expect(res.status).toBe(400);
    });

    it('token null textual -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .send({
                access_token: 'null',
            });

        expect(res.status).toBe(400);
    });

    it('token sem id -> 498', async () => {
        const token = jwt.sign(
            { sub: 'sem-id' },
            process.env.JWT_SECRET_ACCESS_TOKEN,
        );

        const res = await request(app)
            .post('/api/auth/logout')
            .send({
                access_token: token,
            });

        expect(res.status).toBe(498);
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

    it('refresh token diferente do armazenado -> 401', async () => {
        const usuario = await criarUsuario();

        const refreshTokenArmazenado = jwt.sign(
            { id: usuario._id.toString(), origem: 'banco' },
            process.env.JWT_SECRET_REFRESH_TOKEN,
        );
        const refreshTokenEnviado = jwt.sign(
            { id: usuario._id.toString(), origem: 'cliente' },
            process.env.JWT_SECRET_REFRESH_TOKEN,
        );

        await Usuario.findByIdAndUpdate(usuario._id, {
            refreshtoken: refreshTokenArmazenado,
        });

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({
                refresh_token: refreshTokenEnviado,
            });

        expect(res.status).toBe(401);
    });

    it('refresh token de usuário inexistente -> 404', async () => {
        const refreshToken = jwt.sign(
            { id: new mongoose.Types.ObjectId().toString() },
            process.env.JWT_SECRET_REFRESH_TOKEN,
        );

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({
                refresh_token: refreshToken,
            });

        expect(res.status).toBe(404);
    });

    it('refresh token ausente -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({});

        expect(res.status).toBe(400);
    });

    it('refresh token undefined textual -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({
                refresh_token: 'undefined',
            });

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
                email: `  ${usuario.email.toUpperCase()}  `,
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
        const res = await request(app)
            .get('/api/auth/verificar-email?token=invalido');

        expect(res.status).toBe(400);
    });

    it('verifica email com sucesso -> 200', async () => {
        await criarUsuario({
            token_verificacao_email: 'token-verificacao',
            exp_token_verificacao_email: new Date(Date.now() + 100000),
            email_verificado: false,
        });

        const res = await request(app)
            .get('/api/auth/verificar-email?token=token-verificacao');

        expect(res.status).toBe(200);
    });

    it('token expirado reenvia email de verificação -> 400', async () => {
        await criarUsuario({
            token_verificacao_email: 'token-verificacao-expirado',
            exp_token_verificacao_email: new Date(Date.now() - 1000),
            email_verificado: false,
        });

        const res = await request(app)
            .get('/api/auth/verificar-email?token=token-verificacao-expirado');

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/google', () => {
    it('payload inválido -> 400', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({});

        expect(res.status).toBe(400);
    });

    it('login google cria usuário novo -> 200', async () => {
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: nextId('google-sub'),
                email: `${nextId('google')}@test.local`,
                name: 'Usuário Google',
                picture: 'perfil.png',
            }),
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(200);

        expect(res.body.data.user.authProvider).toBe('google');
        expect(res.body.data.user.email_verificado).toBe(true);
    });

    it('login google cria usuário novo sem foto -> 200', async () => {
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: nextId('google-sub'),
                email: `${nextId('google-sem-foto')}@test.local`,
                name: 'Usuário Google Sem Foto',
            }),
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.user.foto_perfil).toBe('');
    });

    it('login google vincula conta local existente pelo email -> 200', async () => {
        const usuario = await criarUsuario({
            foto_perfil: '',
        });

        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: nextId('google-sub'),
                email: usuario.email,
                name: usuario.nome,
                picture: 'perfil-google.png',
            }),
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(usuario.email);
        expect(res.body.data.user.authProvider).toBe('local');
    });

    it('login google vincula conta sem senha existente pelo email -> 200', async () => {
        const usuario = await criarUsuario({
            senha: null,
            authProvider: 'google',
            foto_perfil: '',
        });

        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: nextId('google-sub'),
                email: usuario.email,
                name: usuario.nome,
                picture: '',
            }),
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(usuario.email);
        expect(res.body.data.user.authProvider).toBe('google');
    });

    it('login google reutiliza usuário pelo googleId e renova refresh expirado -> 200', async () => {
        const googleId = nextId('google-id');
        const usuario = await criarUsuario({
            senha: null,
            googleId,
            authProvider: 'google',
            cpf: '08573215099',
            telefone: '69999998888',
            profileComplete: false,
        });
        const refreshTokenExpirado = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_REFRESH_TOKEN,
            { expiresIn: '-1s' },
        );

        await Usuario.findByIdAndUpdate(usuario._id, {
            refreshtoken: refreshTokenExpirado,
        });

        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: googleId,
                email: usuario.email,
                name: usuario.nome,
                picture: '',
            }),
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.user.refreshtoken).not.toBe(refreshTokenExpirado);
        expect(res.body.data.user.profileComplete).toBe(true);
    });

    it('login google rejeita token inválido -> 401', async () => {
        mockVerifyIdToken.mockRejectedValue(new Error('token invalido'));

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(401);
    });

    it('login google rejeita usuário inativo -> 403', async () => {
        const googleId = nextId('google-id');
        const usuario = await criarUsuario({
            senha: null,
            googleId,
            authProvider: 'google',
            status: 'inativo',
        });

        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: googleId,
                email: usuario.email,
                name: usuario.nome,
                picture: '',
            }),
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({
                idToken: 'google-token',
            });

        expect(res.status).toBe(403);
    });
});

describe('AuthMiddleware integrado ao arquivo de rotas de autenticaÃ§Ã£o', () => {
    it('rejeita requisiÃ§Ã£o sem header Authorization', async () => {
        const next = jest.fn();

        await AuthMiddleware(criarReqMiddleware(), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
        expect(next.mock.calls[0][0].message).toContain('token');
    });

    it('rejeita formato de token invÃ¡lido', async () => {
        const next = jest.fn();

        await AuthMiddleware(criarReqMiddleware('Basic abc'), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('autentica token vÃ¡lido com refresh token salvo', async () => {
        const token = jwt.sign({ id: 'usuario-1' }, process.env.JWT_SECRET_ACCESS_TOKEN);
        const req = criarReqMiddleware(`Bearer ${token}`);
        const next = jest.fn();
        const carregaTokensSpy = jest
            .spyOn(AuthService.prototype, 'carregatokens')
            .mockResolvedValue({ data: { refreshtoken: 'refresh-token' } });

        await AuthMiddleware(req, {}, next);

        expect(req.user_id).toBe('usuario-1');
        expect(carregaTokensSpy).toHaveBeenCalledWith('usuario-1');
        expect(next).toHaveBeenCalledWith();

        carregaTokensSpy.mockRestore();
    });

    it('rejeita quando jwt.verify resolve sem decoded', async () => {
        const verifySpy = jest
            .spyOn(jwt, 'verify')
            .mockImplementationOnce((token, secret, callback) => callback(null, null));
        const req = criarReqMiddleware('Bearer token-sem-decoded');
        const next = jest.fn();

        await AuthMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));

        verifySpy.mockRestore();
    });

    it('rejeita token vÃ¡lido sem refresh token persistido', async () => {
        const token = jwt.sign({ id: 'usuario-1' }, process.env.JWT_SECRET_ACCESS_TOKEN);
        const next = jest.fn();
        const carregaTokensSpy = jest
            .spyOn(AuthService.prototype, 'carregatokens')
            .mockResolvedValue({ data: {} });

        await AuthMiddleware(criarReqMiddleware(`Bearer ${token}`), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(CustomError));
        expect(next.mock.calls[0][0]).toMatchObject({
            statusCode: 401,
            errorType: 'unauthorized',
            field: 'Token',
        });

        carregaTokensSpy.mockRestore();
    });

    it('traduz JsonWebTokenError para AuthenticationError', async () => {
        const next = jest.fn();

        await AuthMiddleware(criarReqMiddleware('Bearer token-invalido'), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
        expect(next.mock.calls[0][0].message).toContain('JWT');
    });

    it('traduz TokenExpiredError do JWT para erro de token expirado', async () => {
        const token = jwt.sign(
            { id: 'usuario-1' },
            process.env.JWT_SECRET_ACCESS_TOKEN,
            { expiresIn: '-1s' },
        );
        const next = jest.fn();

        await AuthMiddleware(criarReqMiddleware(`Bearer ${token}`), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
    });

    it('propaga erros inesperados do AuthService', async () => {
        const token = jwt.sign({ id: 'usuario-1' }, process.env.JWT_SECRET_ACCESS_TOKEN);
        const erro = new Error('falha inesperada');
        const next = jest.fn();
        const carregaTokensSpy = jest
            .spyOn(AuthService.prototype, 'carregatokens')
            .mockRejectedValue(erro);

        await AuthMiddleware(criarReqMiddleware(`Bearer ${token}`), {}, next);

        expect(next).toHaveBeenCalledWith(erro);

        carregaTokensSpy.mockRestore();
    });
});

describe('AuthController - fallbacks de entrada', () => {
    function createResponse() {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        return res;
    }

    it('login trata body ausente como objeto vazio', async () => {
        const controller = new AuthController();

        await expect(controller.login({}, createResponse()))
            .rejects
            .toBeDefined();
    });

    it('googleLogin trata body ausente como objeto vazio', async () => {
        const controller = new AuthController();

        await expect(controller.googleLogin({}, createResponse()))
            .rejects
            .toBeDefined();
    });

    it('recuperaSenha trata body ausente como objeto vazio', async () => {
        const controller = new AuthController();

        await expect(controller.recuperaSenha({}, createResponse()))
            .rejects
            .toMatchObject({
                statusCode: 400,
                field: 'email',
            });
    });

    it('signup trata body ausente como objeto vazio', async () => {
        const controller = new AuthController();

        await expect(controller.signup({}, createResponse()))
            .rejects
            .toBeDefined();
    });

    it('verificarEmail usa mensagem padrão quando erro não possui mensagem', async () => {
        const controller = new AuthController();
        const res = createResponse();
        controller.service = {
            verificarEmail: jest.fn().mockRejectedValue({}),
        };

        await controller.verificarEmail({
            query: {
                token: 'token-com-erro-sem-mensagem',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send.mock.calls[0][0])
            .toContain('Falha ao processar o token');
    });
});

describe('AuthService - regras internas de autenticação', () => {
    it('carrega tokens do usuário pelo repositório', async () => {
        const service = new AuthService();
        const usuario = { _id: new mongoose.Types.ObjectId() };
        service.repository = {
            buscarPorID: jest.fn().mockResolvedValue(usuario),
        };

        await expect(service.carregatokens(usuario._id)).resolves.toEqual({
            data: usuario,
        });

        expect(service.repository.buscarPorID)
            .toHaveBeenCalledWith(usuario._id, true);
    });

    it('refresh retorna 404 quando o repositório não encontra usuário', async () => {
        const service = new AuthService();
        service.repository = {
            buscarPorID: jest.fn().mockResolvedValue(null),
        };

        await expect(service.refresh('id-inexistente', 'token'))
            .rejects
            .toMatchObject({
                statusCode: 404,
                field: 'Token',
            });
    });

    it('refresh atualiza profileComplete quando CPF e telefone completam o perfil', async () => {
        const service = new AuthService({
            tokenUtil: {
                generateAccessToken: jest.fn().mockResolvedValue('access-token'),
            },
        });

        const id = new mongoose.Types.ObjectId().toString();
        const usuarioComToken = {
            _id: id,
            refreshtoken: 'refresh-token',
            cpf: '08573215099',
            telefone: '69999998888',
            profileComplete: false,
        };
        const usuarioSemTokens = {
            toObject: () => ({
                _id: id,
                email: 'refresh@test.local',
            }),
        };

        service.repository = {
            buscarPorID: jest.fn()
                .mockResolvedValueOnce(usuarioComToken)
                .mockResolvedValueOnce(usuarioSemTokens),
            armazenarTokens: jest.fn().mockResolvedValue(usuarioComToken),
            atualizar: jest.fn().mockResolvedValue({
                ...usuarioComToken,
                profileComplete: true,
            }),
        };

        const result = await service.refresh(id, 'refresh-token');

        expect(result.user.profileComplete).toBe(true);
        expect(service.repository.atualizar)
            .toHaveBeenCalledWith(id, { profileComplete: true });
    });

    it('atualizarSenhaToken rejeita token expirado pela data bruta do documento', async () => {
        const service = new AuthService();
        service.repository = {
            buscarPorTokenUnico: jest.fn().mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                exp_codigo_recupera_senha: new Date(Date.now() - 1000),
            }),
        };

        await expect(service.atualizarSenhaToken('token-expirado', 'NovaSenha@123'))
            .rejects
            .toMatchObject({
                statusCode: 401,
                field: 'Token de Recuperação',
            });
    });

    it('atualizarSenhaToken retorna erro quando a senha não é persistida', async () => {
        const service = new AuthService();
        service.repository = {
            buscarPorTokenUnico: jest.fn().mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                get: jest.fn().mockReturnValue(new Date(Date.now() + 100000)),
            }),
            atualizarSenha: jest.fn().mockResolvedValue(null),
        };

        await expect(service.atualizarSenhaToken('token-valido', 'NovaSenha@123'))
            .rejects
            .toMatchObject({
                statusCode: 500,
                field: 'Senha',
            });
    });
});
