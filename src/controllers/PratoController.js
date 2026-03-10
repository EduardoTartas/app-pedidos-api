// src/controllers/PratoController.js

import PratoService from '../service/PratoService.js';
import {
    PratoSchema,
    PratoUpdateSchema
} from '../utils/validators/schemas/zod/PratoSchema.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import { PratoQuerySchema } from '../utils/validators/schemas/zod/querys/PratoQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class PratoController {
    constructor() {
        this.service = new PratoService();
    }

    async listar(req, res) {
        const { id } = req.params;
        if (id) {
            IdSchema.parse(id);
        }

        const query = req?.query;
        if (Object.keys(query).length !== 0) {
            await PratoQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);

        // Mensagem contextualizada para listagem
        if (id) {
            return CommonResponse.success(
                res,
                data,
                HttpStatusCodes.OK.code,
                'Prato encontrado com sucesso.',
            );
        }

        // Resultado paginado - verificar se há resultados
        const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
        if (totalDocs === 0) {
            const temFiltros = query && (query.nome || query.secao || query.status);
            const mensagem = temFiltros
                ? 'Nenhum prato encontrado com os filtros informados.'
                : 'Nenhum prato cadastrado.';
            return CommonResponse.success(
                res,
                data,
                HttpStatusCodes.OK.code,
                mensagem,
            );
        }

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            `${totalDocs} prato(s) encontrado(s).`,
        );
    }

    async buscarCardapio(req, res) {
        const { restauranteId } = req.params;
        IdSchema.parse(restauranteId);

        const data = await this.service.buscarCardapio(restauranteId);

        const totalPratos = Object.values(data).reduce((acc, arr) => acc + arr.length, 0);
        if (totalPratos === 0) {
            return CommonResponse.success(
                res,
                data,
                HttpStatusCodes.OK.code,
                'Nenhum prato disponível no cardápio deste restaurante.',
            );
        }

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            `Cardápio encontrado com ${totalPratos} prato(s).`,
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
                    'O corpo da requisição é obrigatório para criar um prato.',
            });
        }

        const parsedData = PratoSchema.parse(req.body);
        const data = await this.service.criar(parsedData, req);
        return CommonResponse.created(res, data, 'Prato criado com sucesso.');
    }

    async atualizar(req, res) {
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
                    'Informe pelo menos um campo para atualizar o prato.',
            });
        }

        const parsedData = PratoUpdateSchema.parse(req.body);
        const data = await this.service.atualizar(id, parsedData, req);
        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            'Prato atualizado com sucesso.',
        );
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        if (!id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'id',
                details: [
                    {
                        path: 'id',
                        message: 'O ID do prato é obrigatório.',
                    },
                ],
                customMessage: 'ID do prato é obrigatório para deletar.',
            });
        }

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            'Prato excluído com sucesso.',
        );
    }
}

export default PratoController;
