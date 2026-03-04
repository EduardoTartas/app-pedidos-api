// src/controllers/RestauranteController.js

import RestauranteService from '../service/RestauranteService.js';
import {
    RestauranteSchema,
    RestauranteUpdateSchema
} from '../utils/validators/schemas/zod/RestauranteSchema.js';
import {
    RestauranteIdSchema,
    RestauranteQuerySchema
} from '../utils/validators/schemas/zod/querys/RestauranteQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class RestauranteController {
    constructor() {
        this.service = new RestauranteService();
    }

    async listar(req, res) {
        const id = req?.params?.id;
        if (id) {
            RestauranteIdSchema.parse(id);
        }

        const query = req?.query;
        if (Object.keys(query).length !== 0) {
            await RestauranteQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        const parsedData = RestauranteSchema.parse(req.body);
        const data = await this.service.criar(parsedData, req);
        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        const { id } = req.params;
        RestauranteIdSchema.parse(id);

        const parsedData = RestauranteUpdateSchema.parse(req.body);
        const data = await this.service.atualizar(id, parsedData, req);
        return CommonResponse.success(res, data, 200, 'Restaurante atualizado com sucesso.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        RestauranteIdSchema.parse(id);

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(res, data, 200, 'Restaurante excluído com sucesso.');
    }
}

export default RestauranteController;
