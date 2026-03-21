// src/controllers/EnderecoController.js

import EnderecoService from '../service/EnderecoService.js';
import {
    EnderecoSchema,
    EnderecoUpdateSchema,
} from '../utils/validators/schemas/zod/EnderecoSchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes,
} from '../utils/helpers/index.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';

class EnderecoController {
    constructor() {
        this.service = new EnderecoService();
    }

    // === Endereços de Usuário ===

    async listarPorUsuario(req, res) {
        const { usuarioId } = req.params;
        objectIdSchema.parse(usuarioId);

        const data = await this.service.listarPorUsuario(usuarioId, req);

        const total = data?.length ?? 0;
        const mensagem = total === 0
            ? 'Nenhum endereço cadastrado para este usuário.'
            : `${total} endereço(s) encontrado(s).`;

        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, mensagem);
    }

    async criarParaUsuario(req, res) {
        const { usuarioId } = req.params;
        objectIdSchema.parse(usuarioId);

        if (!req.body || Object.keys(req.body).length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'body',
                details: [{ path: 'body', message: 'O corpo da requisição não pode ser vazio.' }],
                customMessage: 'O corpo da requisição é obrigatório para criar um endereço.',
            });
        }

        const parsedData = EnderecoSchema.parse(req.body);
        const data = await this.service.criarParaUsuario(usuarioId, parsedData, req);
        return CommonResponse.created(res, data, 'Endereço criado com sucesso.');
    }

    async atualizarDeUsuario(req, res) {
        const { usuarioId, enderecoId } = req.params;
        objectIdSchema.parse(usuarioId);
        objectIdSchema.parse(enderecoId);

        if (!req.body || Object.keys(req.body).length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'body',
                details: [{ path: 'body', message: 'O corpo da requisição não pode ser vazio.' }],
                customMessage: 'Informe pelo menos um campo para atualizar o endereço.',
            });
        }

        const parsedData = EnderecoUpdateSchema.parse(req.body);
        const data = await this.service.atualizarDeUsuario(usuarioId, enderecoId, parsedData, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Endereço atualizado com sucesso.');
    }

    async deletarDeUsuario(req, res) {
        const { usuarioId, enderecoId } = req.params;
        objectIdSchema.parse(usuarioId);
        objectIdSchema.parse(enderecoId);

        const data = await this.service.deletarDeUsuario(usuarioId, enderecoId, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Endereço excluído com sucesso.');
    }

    // === Endereço de Restaurante ===

    async buscarPorRestaurante(req, res) {
        const { restauranteId } = req.params;
        objectIdSchema.parse(restauranteId);

        const data = await this.service.buscarPorRestaurante(restauranteId);

        const mensagem = data
            ? 'Endereço do restaurante encontrado.'
            : 'Nenhum endereço cadastrado para este restaurante.';

        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, mensagem);
    }

    async criarParaRestaurante(req, res) {
        const { restauranteId } = req.params;
        objectIdSchema.parse(restauranteId);

        if (!req.body || Object.keys(req.body).length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'body',
                details: [{ path: 'body', message: 'O corpo da requisição não pode ser vazio.' }],
                customMessage: 'O corpo da requisição é obrigatório para criar um endereço.',
            });
        }

        const parsedData = EnderecoSchema.parse(req.body);
        const data = await this.service.criarParaRestaurante(restauranteId, parsedData, req);
        return CommonResponse.created(res, data, 'Endereço do restaurante criado com sucesso.');
    }

    async atualizarDeRestaurante(req, res) {
        const { restauranteId, enderecoId } = req.params;
        objectIdSchema.parse(restauranteId);
        objectIdSchema.parse(enderecoId);

        if (!req.body || Object.keys(req.body).length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'body',
                details: [{ path: 'body', message: 'O corpo da requisição não pode ser vazio.' }],
                customMessage: 'Informe pelo menos um campo para atualizar o endereço.',
            });
        }

        const parsedData = EnderecoUpdateSchema.parse(req.body);
        const data = await this.service.atualizarDeRestaurante(restauranteId, enderecoId, parsedData, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Endereço do restaurante atualizado com sucesso.');
    }

    async deletarDeRestaurante(req, res) {
        const { restauranteId, enderecoId } = req.params;
        objectIdSchema.parse(restauranteId);
        objectIdSchema.parse(enderecoId);

        const data = await this.service.deletarDeRestaurante(restauranteId, enderecoId, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Endereço do restaurante excluído com sucesso.');
    }
}

export default EnderecoController;
