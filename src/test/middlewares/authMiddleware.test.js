const mockCarregaTokens = jest.fn();

jest.mock('../../service/AuthService.js', () => ({
    __esModule: true,
    default: class {
        carregatokens(...args) {
            return mockCarregaTokens(...args);
        }
    },
}));

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import AuthMiddleware from '../../middlewares/AuthMiddleware.js';
import AuthenticationError from '../../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../../utils/errors/TokenExpiredError.js';
import CustomError from '../../utils/helpers/CustomError.js';

const originalEnv = { ...process.env };

function criarReq(authorization) {
    return {
        headers: authorization ? { authorization } : {},
    };
}

beforeEach(() => {
    process.env.JWT_SECRET_ACCESS_TOKEN = 'access-secret-test';
    mockCarregaTokens.mockReset();
});

afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
});

describe('AuthMiddleware', () => {
    it('rejeita requisicao sem header Authorization', async () => {
        const next = jest.fn();

        await AuthMiddleware(criarReq(), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
        expect(next.mock.calls[0][0].message).toContain('token');
    });

    it('rejeita formato de token invalido', async () => {
        const next = jest.fn();

        await AuthMiddleware(criarReq('Basic abc'), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('autentica token valido com refresh token salvo', async () => {
        const token = jwt.sign({ id: 'usuario-1' }, process.env.JWT_SECRET_ACCESS_TOKEN);
        const req = criarReq(`Bearer ${token}`);
        const next = jest.fn();
        mockCarregaTokens.mockResolvedValue({ data: { refreshtoken: 'refresh-token' } });

        await AuthMiddleware(req, {}, next);

        expect(req.user_id).toBe('usuario-1');
        expect(mockCarregaTokens).toHaveBeenCalledWith('usuario-1');
        expect(next).toHaveBeenCalledWith();
    });

    it('rejeita quando jwt.verify resolve sem decoded', async () => {
        jest.spyOn(jwt, 'verify').mockImplementationOnce((token, secret, callback) => callback(null, null));
        const req = criarReq('Bearer token-sem-decoded');
        const next = jest.fn();

        await AuthMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
    });

    it('rejeita token valido sem refresh token persistido', async () => {
        const token = jwt.sign({ id: 'usuario-1' }, process.env.JWT_SECRET_ACCESS_TOKEN);
        const next = jest.fn();
        mockCarregaTokens.mockResolvedValue({ data: {} });

        await AuthMiddleware(criarReq(`Bearer ${token}`), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(CustomError));
        expect(next.mock.calls[0][0]).toMatchObject({
            statusCode: 401,
            errorType: 'unauthorized',
            field: 'Token',
        });
    });

    it('traduz JsonWebTokenError para AuthenticationError', async () => {
        const next = jest.fn();

        await AuthMiddleware(criarReq('Bearer token-invalido'), {}, next);

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

        await AuthMiddleware(criarReq(`Bearer ${token}`), {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
    });

    it('propaga erros inesperados do AuthService', async () => {
        const token = jwt.sign({ id: 'usuario-1' }, process.env.JWT_SECRET_ACCESS_TOKEN);
        const erro = new Error('falha inesperada');
        const next = jest.fn();
        mockCarregaTokens.mockRejectedValue(erro);

        await AuthMiddleware(criarReq(`Bearer ${token}`), {}, next);

        expect(next).toHaveBeenCalledWith(erro);
    });
});
