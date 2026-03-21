// src/controllers/PedidoController.js

import PedidoService from '../service/PedidoService.js';
import { PedidoSchema, PedidoStatusSchema } from '../utils/validators/schemas/zod/PedidoSchema.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import { PedidoQuerySchema } from '../utils/validators/schemas/zod/querys/PedidoQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class PedidoController {
    constructor() {
        this.service = new PedidoService();
    }

    async listarMeusPedidos(req, res) {
        const query = req?.query;
        if (Object.keys(query).length !== 0) {
            await PedidoQuerySchema.parseAsync(query);
        }

        const data = await this.service.listarMeusPedidos(req);

        const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
        if (totalDocs === 0) {
            const temFiltros = query && query.status;
            const mensagem = temFiltros
                ? 'Nenhum pedido encontrado com os filtros informados.'
                : 'Nenhum pedido encontrado.';
            return CommonResponse.success(res, data, HttpStatusCodes.OK.code, mensagem);
        }

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            `${totalDocs} pedido(s) encontrado(s).`
        );
    }

    async listarPedidosRestaurante(req, res) {
        const { restauranteId } = req.params;
        IdSchema.parse(restauranteId);

        const query = req?.query;
        if (Object.keys(query).length !== 0) {
            await PedidoQuerySchema.parseAsync(query);
        }

        const data = await this.service.listarPedidosRestaurante(restauranteId, req);

        const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
        if (totalDocs === 0) {
            const temFiltros = query && query.status;
            const mensagem = temFiltros
                ? 'Nenhum pedido encontrado com os filtros informados.'
                : 'Nenhum pedido encontrado para este restaurante.';
            return CommonResponse.success(res, data, HttpStatusCodes.OK.code, mensagem);
        }

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            `${totalDocs} pedido(s) encontrado(s).`
        );
    }

    async criar(req, res) {
        // Validar se o body não está vazio
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'body',
                details: [
                    {
                        path: 'body',
                        message: 'O corpo da requisição não pode ser vazio.',
                    },
                ],
                customMessage:
                    'O corpo da requisição é obrigatório para criar um pedido.',
            });
        }

        const parsedData = PedidoSchema.parse(req.body);
        const data = await this.service.criar(parsedData, req);
        return CommonResponse.created(res, data, 'Pedido criado com sucesso.');
    }

    async atualizarStatus(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        // Validar se o body não está vazio
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'body',
                details: [
                    {
                        path: 'body',
                        message: 'O corpo da requisição não pode ser vazio.',
                    },
                ],
                customMessage:
                    'Informe o novo status do pedido.',
            });
        }

        const parsedData = PedidoStatusSchema.parse(req.body);
        const data = await this.service.atualizarStatus(id, parsedData, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Status do pedido atualizado com sucesso.');
    }
}

export default PedidoController;
