// src/controllers/AdicionalGrupoController.js

import AdicionalGrupoService from '../service/AdicionalGrupoService.js';
import {
    AdicionalGrupoSchema,
    AdicionalGrupoUpdateSchema
} from '../utils/validators/schemas/zod/AdicionalSchema.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class AdicionalGrupoController {
    constructor() {
        this.service = new AdicionalGrupoService();
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
        const { prato_id: pratoId, ...grupoData } = parsedData;
        const data = await this.service.criar(grupoData, pratoId, req);
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
