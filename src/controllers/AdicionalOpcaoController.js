// src/controllers/AdicionalOpcaoController.js

import AdicionalOpcaoService from '../service/AdicionalOpcaoService.js';
import {
    AdicionalOpcaoSchema,
    AdicionalOpcaoUpdateSchema
} from '../utils/validators/schemas/zod/AdicionalSchema.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class AdicionalOpcaoController {
    constructor() {
        this.service = new AdicionalOpcaoService();
    }

    async listar(req, res) {
        const { grupoId } = req.params;
        IdSchema.parse(grupoId);

        const data = await this.service.listar(grupoId, req);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        const parsedData = AdicionalOpcaoSchema.parse(req.body);
        const data = await this.service.criar(parsedData, req);
        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const parsedData = AdicionalOpcaoUpdateSchema.parse(req.body);
        const data = await this.service.atualizar(id, parsedData, req);
        return CommonResponse.success(res, data, 200, 'Opção de adicional atualizada com sucesso.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(res, data, 200, 'Opção de adicional excluída com sucesso.');
    }
}

export default AdicionalOpcaoController;
