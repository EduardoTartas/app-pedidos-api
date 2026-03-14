// src/controllers/CategoriaController.js

import CategoriaService from '../service/CategoriaService.js';
import {
    CategoriaSchema,
    CategoriaUpdateSchema
} from '../utils/validators/schemas/zod/CategoriaSchema.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class CategoriaController {
    constructor() {
        this.service = new CategoriaService();
    }

    async listar(req, res) {
        const id = req?.params?.id;
        if (id) {
            IdSchema.parse(id);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        const parsedData = CategoriaSchema.parse(req.body);
        const data = await this.service.criar(parsedData, req);
        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const parsedData = CategoriaUpdateSchema.parse(req.body);
        const data = await this.service.atualizar(id, parsedData, req);
        return CommonResponse.success(res, data, 200, 'Categoria atualizada com sucesso.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(res, data, 200, 'Categoria excluída com sucesso.');
    }
}

export default CategoriaController;
