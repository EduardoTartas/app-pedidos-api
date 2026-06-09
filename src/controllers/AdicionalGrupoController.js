// src/controllers/AdicionalGrupoController.js

import {
    AdicionalGrupoSchema,
    AdicionalGrupoUpdateSchema
} from '../utils/validators/schemas/zod/AdicionalSchema.js';
import IdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import AdicionalGrupoService from '../service/AdicionalGrupoService.js';
import CommonResponse from '../utils/helpers/CommonResponse.js';
import { HttpStatusCodes, CustomError } from '../utils/helpers/index.js';

class AdicionalGrupoController {
    constructor() {
        this.service = new AdicionalGrupoService();
    }

    async listar(req, res) {
        const { restaurante_id: restauranteId, prato_id: pratoId } = req.query;

        let data;
        if (pratoId) {
            data = await this.service.listarPorPrato(pratoId);
        } else if (restauranteId) {
            data = await this.service.listarPorRestaurante(restauranteId);
        } else {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'invalidQuery',
                field: 'query',
                customMessage: 'Informe restaurante_id ou prato_id para listar os grupos.'
            });
        }

        return CommonResponse.success(res, data);
    }

    async listarPorPrato(req, res) {
        const { pratoId } = req.params;
        IdSchema.parse(pratoId);

        const data = await this.service.listarPorPrato(pratoId);
        return CommonResponse.success(res, data);
    }

    async buscarPorID(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.buscarPorID(id);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        const parsedData = AdicionalGrupoSchema.parse(req.body);
        const { prato_id: pratoId, restaurante_id: restauranteId, ...grupoData } = parsedData;

        // Passa restauranteId se pratoId não for fornecido
        const data = await this.service.criar(grupoData, pratoId || restauranteId, req, !!pratoId);
        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const parsedData = AdicionalGrupoUpdateSchema.parse(req.body);
        const data = await this.service.atualizar(id, parsedData, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Grupo de adicional atualizado com sucesso.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Grupo de adicional excluído com sucesso.');
    }
}

export default AdicionalGrupoController;
