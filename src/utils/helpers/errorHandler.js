// src/utils/helpers/errorHandler.js

import { ZodError } from 'zod';
import logger from '../logger.js';
import CommonResponse from './CommonResponse.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import AuthenticationError from '../errors/AuthenticationError.js';
import TokenExpiredError from '../errors/TokenExpiredError.js';
import CustomError from './CustomError.js';

const errorHandler = (err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorId = uuidv4();
    const requestId = req.requestId || 'N/A';

    // Tratamento para erros de validação do Zod
    if (err instanceof ZodError) {
        const zodIssues = err.issues || err.errors || [];
        logger.warn('Erro de validação', { errors: zodIssues, path: req.path, requestId });
        return CommonResponse.error(
            res,
            400,
            'validationError',
            null,
            zodIssues.map(e => ({ path: (e.path || []).join('.'), message: e.message })),
            `Erro de validação. ${zodIssues.length} campo(s) inválido(s).`
        );
    }

    // Tratamento para erro de chave duplicada no MongoDB (código 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        const value = err.keyValue ? err.keyValue[field] : 'duplicado';
        logger.warn('Erro de chave duplicada', { field, value, path: req.path, requestId });
        return CommonResponse.error(
            res,
            409,
            'duplicateEntry',
            field,
            [{ path: field, message: `O valor "${value}" já está em uso.` }],
            `Entrada duplicada no campo "${field}".`
        );
    }

    // Tratamento para erros de validação do Mongoose
    if (err instanceof mongoose.Error.ValidationError) {
        const detalhes = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
        logger.warn('Erro de validação do Mongoose', { details: detalhes, path: req.path, requestId });
        return CommonResponse.error(res, 400, 'validationError', null, detalhes);
    }

    // Tratamento para erros de autenticação
    if (err instanceof AuthenticationError || err instanceof TokenExpiredError) {
        logger.warn('Erro de autenticação', { message: err.message, path: req.path, requestId });
        return CommonResponse.error(
            res,
            err.statusCode,
            'authenticationError',
            null,
            [{ message: err.message }],
            err.message
        );
    }

    // Tratamento específico para CustomError com errorType 'tokenExpired'
    if (err instanceof CustomError && err.errorType === 'tokenExpired') {
        logger.warn('Erro de token expirado', { message: err.message, path: req.path, requestId });
        return CommonResponse.error(
            res,
            err.statusCode || 401,
            'tokenExpired',
            null,
            [{ message: err.customMessage || 'Token expirado.' }],
            err.customMessage || 'Token expirado. Por favor, faça login novamente.'
        );
    }

    // Tratamento para erros de parsing JSON
    if (err.name === 'SyntaxError' || err.type === 'entity.parse.failed' || err.message?.includes('Unexpected token') || err.message?.includes('is not valid JSON')) {
        logger.warn('Erro de parsing JSON', { message: err.message, path: req.path, requestId });
        return CommonResponse.error(
            res,
            400,
            'validationError',
            'body',
            [{ path: 'body', message: 'JSON inválido. Verifique a sintaxe do corpo da requisição.' }],
            'Formato JSON inválido.'
        );
    }

    // Tratamento para erros operacionais
    if (err.isOperational) {
        logger.warn('Erro operacional', { message: err.message, path: req.path, requestId });
        return CommonResponse.error(
            res,
            err.statusCode,
            err.errorType || 'operationalError',
            err.field || null,
            err.details || [],
            err.customMessage || 'Erro operacional.'
        );
    }

    // Tratamento para erros internos
    logger.error(`Erro interno [ID: ${errorId}]`, { message: err.message, stack: err.stack, requestId });
    const detalhes = isProduction
        ? [{ message: `Erro interno do servidor. Referência: ${errorId}` }]
        : [{ message: err.message, stack: err.stack }];

    return CommonResponse.error(res, 500, 'serverError', null, detalhes);
};

export default errorHandler;
