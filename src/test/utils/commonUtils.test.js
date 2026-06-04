import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import AuthHelper from '../../utils/AuthHelper.js';
import TokenUtil from '../../utils/TokenUtil.js';
import AuthenticationError from '../../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../../utils/errors/TokenExpiredError.js';
import messages from '../../utils/helpers/messages.js';
import {
    IdSchema,
    PaginationQuerySchema,
} from '../../utils/validators/schemas/zod/querys/CommonQuerySchema.js';

const originalEnv = { ...process.env };

beforeEach(() => {
    process.env.JWT_SECRET_ACCESS_TOKEN = 'access-secret-test';
    process.env.JWT_SECRET_REFRESH_TOKEN = 'refresh-secret-test';
    process.env.JWT_SECRET_PASSWORD_RECOVERY = 'recovery-secret-test';
    process.env.SALT_LENGTH = '4';
});

afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
});

describe('CommonQuerySchema', () => {
    it('valida ObjectId e rejeita ids invalidos', () => {
        expect(IdSchema.parse('507f1f77bcf86cd799439011')).toBe('507f1f77bcf86cd799439011');
        expect(() => IdSchema.parse('id-invalido')).toThrow();
    });

    it('aplica paginacao padrao e converte strings numericas', () => {
        expect(PaginationQuerySchema.parse({})).toEqual({ page: 1, limite: 10 });
        expect(PaginationQuerySchema.parse({ page: '2', limite: '50' })).toEqual({ page: 2, limite: 50 });
    });

    it('rejeita paginacao fora dos limites', () => {
        expect(() => PaginationQuerySchema.parse({ page: '0', limite: '10' })).toThrow();
        expect(() => PaginationQuerySchema.parse({ page: '1', limite: '101' })).toThrow();
        expect(() => PaginationQuerySchema.parse({ page: 'abc', limite: '10' })).toThrow();
    });
});

describe('messages', () => {
    it('expoe mensagens fixas e factories de erro', () => {
        expect(messages.info.welcome).toContain('App de Delivery');
        expect(messages.success.default).toContain('sucesso');
        expect(messages.success.logout).toContain('Logout');
        expect(messages.authorized.default).toBe('autorizado');
        expect(messages.error.default).toBeTruthy();
        expect(messages.error.serverError).toBeTruthy();
        expect(messages.error.validationError).toBeTruthy();
        expect(messages.error.invalidRequest).toBeTruthy();
        expect(messages.error.unauthorizedAccess).toBeTruthy();
        expect(messages.error.internalServerError('pedido')).toContain('pedido');
        expect(messages.error.unauthorized('token')).toContain('token');
        expect(messages.error.resourceConflict('Usuario', 'email')).toContain('email');
        expect(messages.error.duplicateEntry('email')).toContain('email');
        expect(messages.error.resourceInUse('restaurante')).toContain('restaurante');
        expect(messages.error.authenticationError('senha')).toContain('senha');
        expect(messages.error.permissionError('perfil')).toContain('perfil');
        expect(messages.error.resourceNotFound('Pedido')).toContain('Pedido');
    });

    it('expoe mensagens de validacao e autenticacao', () => {
        const generic = messages.validation.generic;

        expect(generic.fieldIsRequired('email')).toContain('email');
        expect(generic.fieldIsRepeated('email')).toContain('email');
        expect(generic.invalidInputFormat('cpf')).toContain('cpf');
        expect(generic.invalid('status')).toContain('status');
        expect(generic.notFound('id')).toContain('id');
        expect(generic.resourceCreated('Pedido')).toContain('Pedido');
        expect(generic.resourceUpdated('Pedido')).toContain('Pedido');
        expect(generic.resourceDeleted('Pedido')).toContain('Pedido');
        expect(generic.resourceAlreadyExists('Pedido')).toContain('Pedido');
        expect(messages.auth.authenticationFailed).toContain('Falha');
        expect(messages.auth.invalidPermission).toBeTruthy();
        expect(messages.auth.invalidToken).toContain('Token');
        expect(messages.auth.invalidCredentials).toContain('Credenciais');
    });
});

describe('erros de autenticacao', () => {
    it('AuthenticationError define metadados esperados', () => {
        const error = new AuthenticationError('token invalido');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('AuthenticationError');
        expect(error.statusCode).toBe(498);
        expect(error.isOperational).toBe(true);
        expect(error.message).toBe('token invalido');
    });

    it('TokenExpiredError define metadados esperados', () => {
        const error = new TokenExpiredError('token expirado');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('TokenExpiredError');
        expect(error.statusCode).toBe(498);
        expect(error.isOperational).toBe(true);
        expect(error.message).toBe('token expirado');
    });
});

describe('AuthHelper', () => {
    it('decodifica token JWT e retorna null quando decode lancar erro', () => {
        const token = jwt.sign({ id: 'usuario-1' }, 'decode-secret');

        expect(AuthHelper.decodeToken(token)).toMatchObject({ id: 'usuario-1' });

        jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
            throw new Error('decode quebrado');
        });

        expect(AuthHelper.decodeToken('token')).toBeNull();
    });

    it('gera hash, compara senha e gera token aleatorio', async () => {
        const hash = await AuthHelper.hashPassword('Senha@123');

        await expect(AuthHelper.comparePassword('Senha@123', hash)).resolves.toBe(true);
        await expect(AuthHelper.comparePassword('OutraSenha', hash)).resolves.toBe(false);
        await expect(AuthHelper.generateRandomToken()).resolves.toHaveLength(64);
        await expect(AuthHelper.generateRandomToken(4)).resolves.toHaveLength(8);
    });

    it('usa salt padrao quando SALT_LENGTH nao esta definido', async () => {
        delete process.env.SALT_LENGTH;

        const hash = await AuthHelper.hashPassword('Senha@123');

        await expect(AuthHelper.comparePassword('Senha@123', hash)).resolves.toBe(true);
    });
});

describe('TokenUtil', () => {
    it('gera tokens JWT e decodifica token de recuperacao', async () => {
        const accessToken = await TokenUtil.generateAccessToken('usuario-1');
        const refreshToken = await TokenUtil.generateRefreshToken('usuario-1');
        const recoveryToken = await TokenUtil.generatePasswordRecoveryToken('usuario-1');

        expect(jwt.verify(accessToken, process.env.JWT_SECRET_ACCESS_TOKEN)).toMatchObject({ id: 'usuario-1' });
        expect(jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN)).toMatchObject({ id: 'usuario-1' });
        await expect(TokenUtil.decodePasswordRecoveryToken(
            recoveryToken,
            process.env.JWT_SECRET_PASSWORD_RECOVERY,
        )).resolves.toBe('usuario-1');
    });

    it('gera codigo de recuperacao com seis digitos', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        expect(TokenUtil.generateRecoveryCode()).toBe('100000');

        Math.random.mockReturnValue(0.999999);
        expect(TokenUtil.generateRecoveryCode()).toHaveLength(6);
    });

    it('rejeita erros de assinatura e verificacao', async () => {
        jest.spyOn(jwt, 'sign')
            .mockImplementationOnce((payload, secret, options, callback) => callback(new Error('access fail')))
            .mockImplementationOnce((payload, secret, options, callback) => callback(new Error('refresh fail')))
            .mockImplementationOnce((payload, secret, options, callback) => callback(new Error('recovery fail')));

        await expect(TokenUtil.generateAccessToken('usuario-1')).rejects.toThrow('access fail');
        await expect(TokenUtil.generateRefreshToken('usuario-1')).rejects.toThrow('refresh fail');
        await expect(TokenUtil.generatePasswordRecoveryToken('usuario-1')).rejects.toThrow('recovery fail');

        jest.restoreAllMocks();

        await expect(TokenUtil.decodePasswordRecoveryToken('token-invalido', 'secret'))
            .rejects
            .toThrow();
    });
});
