const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../utils/logger.js', () => ({
    __esModule: true,
    default: {
        warn: (...args) => mockLoggerWarn(...args),
        error: (...args) => mockLoggerError(...args),
    },
}));

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { z } from 'zod';
import errorHandler from '../../utils/helpers/errorHandler.js';
import CustomError from '../../utils/helpers/CustomError.js';
import AuthenticationError from '../../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../../utils/errors/TokenExpiredError.js';

const originalEnv = { ...process.env };

function criarReq(extra = {}) {
    return {
        path: '/teste',
        requestId: 'request-1',
        ...extra,
    };
}

function criarRes({ headersSent = false } = {}) {
    return {
        headersSent,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

function chamarHandler(err, options = {}) {
    const req = criarReq(options.req);
    const res = criarRes(options.res);
    const next = jest.fn();

    errorHandler(err, req, res, next);

    return { req, res, next };
}

beforeEach(() => {
    process.env.NODE_ENV = 'test';
    mockLoggerWarn.mockReset();
    mockLoggerError.mockReset();
});

afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
});

describe('errorHandler', () => {
    it('delega ao Express quando headers ja foram enviados', () => {
        const err = new Error('resposta enviada');
        const { res, next } = chamarHandler(err, { res: { headersSent: true } });

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(err);
        expect(mockLoggerError).toHaveBeenCalled();
    });

    it('formata ZodError como erro de validacao', () => {
        let err;
        try {
            z.object({ nome: z.string() }).parse({ nome: 1 });
        } catch (error) {
            err = error;
        }

        const { res } = chamarHandler(err);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toContain('campo');
        expect(res.json.mock.calls[0][0].errors[0]).toMatchObject({
            path: 'nome',
        });
    });

    it('formata chave duplicada do MongoDB com keyValue', () => {
        const { res } = chamarHandler({
            code: 11000,
            keyValue: { email: 'duplicado@test.local' },
        });

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].errors[0]).toMatchObject({
            path: 'email',
        });
    });

    it('formata chave duplicada sem keyValue', () => {
        const { res } = chamarHandler({ code: 11000 });

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].errors[0].message).toContain('duplicado');
    });

    it('formata ValidationError do Mongoose', () => {
        const err = new mongoose.Error.ValidationError();
        err.addError('nome', new mongoose.Error.ValidatorError({
            path: 'nome',
            message: 'Nome invalido',
        }));

        const { res } = chamarHandler(err);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].errors).toEqual([
            { path: 'nome', message: 'Nome invalido' },
        ]);
    });

    it('formata AuthenticationError e TokenExpiredError', () => {
        const auth = chamarHandler(new AuthenticationError('token invalido')).res;
        const expired = chamarHandler(new TokenExpiredError('token expirado')).res;

        expect(auth.status).toHaveBeenCalledWith(498);
        expect(expired.status).toHaveBeenCalledWith(498);
        expect(auth.json.mock.calls[0][0].message).toBe('token invalido');
        expect(expired.json.mock.calls[0][0].message).toBe('token expirado');
    });

    it('formata CustomError de token expirado com fallback', () => {
        const { res } = chamarHandler(new CustomError({
            errorType: 'tokenExpired',
        }));

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json.mock.calls[0][0].message).toContain('Token expirado');
    });

    it('formata CustomError de token expirado com mensagem customizada', () => {
        const { res } = chamarHandler(new CustomError({
            statusCode: 498,
            errorType: 'tokenExpired',
            customMessage: 'Sessao encerrada',
        }));

        expect(res.status).toHaveBeenCalledWith(498);
        expect(res.json.mock.calls[0][0].message).toBe('Sessao encerrada');
    });

    it('formata CastError do Mongoose e CastError simples', () => {
        const cast = chamarHandler(new mongoose.Error.CastError('ObjectId', 'abc', '_id')).res;
        const castSemPath = chamarHandler({ name: 'CastError', value: 'abc' }).res;

        expect(cast.status).toHaveBeenCalledWith(400);
        expect(cast.json.mock.calls[0][0].errors[0].path).toBe('_id');
        expect(castSemPath.status).toHaveBeenCalledWith(400);
        expect(castSemPath.json.mock.calls[0][0].errors[0].path).toBe('id');
    });

    it('formata erros BSON', () => {
        const bson = chamarHandler({ name: 'BSONError', message: 'id malformado' }).res;
        const bsonType = chamarHandler({ name: 'BSONTypeError', message: 'id malformado' }).res;

        expect(bson.status).toHaveBeenCalledWith(400);
        expect(bsonType.status).toHaveBeenCalledWith(400);
    });

    it('formata StrictModeError com path e sem path', () => {
        const strict = chamarHandler(new mongoose.Error.StrictModeError('campo')).res;
        const strictSemPath = chamarHandler({ name: 'StrictModeError', message: 'campo extra' }).res;

        expect(strict.status).toHaveBeenCalledWith(400);
        expect(strictSemPath.status).toHaveBeenCalledWith(400);
        expect(strictSemPath.json.mock.calls[0][0].errors[0].path).toBe('unknown');
    });

    it('formata erros de JSON invalido por diferentes sinais', () => {
        const syntax = chamarHandler(new SyntaxError('Unexpected token }')).res;
        const byType = chamarHandler({ type: 'entity.parse.failed', message: 'body invalido' }).res;
        const byMessage = chamarHandler({ name: 'OtherError', message: 'body is not valid JSON' }).res;

        expect(syntax.status).toHaveBeenCalledWith(400);
        expect(byType.status).toHaveBeenCalledWith(400);
        expect(byMessage.status).toHaveBeenCalledWith(400);
    });

    it('formata TypeError em desenvolvimento e producao', () => {
        const dev = chamarHandler(new TypeError('Cannot read property')).res;

        process.env.NODE_ENV = 'production';
        const prod = chamarHandler(new TypeError('Cannot read property')).res;

        expect(dev.status).toHaveBeenCalledWith(400);
        expect(dev.json.mock.calls[0][0].errors[0].message).toContain('Cannot read');
        expect(prod.status).toHaveBeenCalledWith(400);
        expect(prod.json.mock.calls[0][0].errors[0].message).toContain('Refer');
    });

    it('formata erros operacionais genericos', () => {
        const { res } = chamarHandler(new CustomError({
            statusCode: 422,
            errorType: 'invalidRequest',
            field: 'pedido',
            details: [{ path: 'pedido', message: 'Pedido invalido' }],
            customMessage: 'Pedido invalido',
        }));

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json.mock.calls[0][0].message).toBe('Pedido invalido');
    });

    it('formata erro interno em desenvolvimento e producao', () => {
        const dev = chamarHandler(new Error('falha interna')).res;

        process.env.NODE_ENV = 'production';
        const prod = chamarHandler(new Error('falha interna')).res;

        expect(dev.status).toHaveBeenCalledWith(500);
        expect(dev.json.mock.calls[0][0].errors[0].stack).toBeTruthy();
        expect(prod.status).toHaveBeenCalledWith(500);
        expect(prod.json.mock.calls[0][0].errors[0].message).toContain('Refer');
    });
});
