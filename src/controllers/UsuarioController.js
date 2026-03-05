// src/controllers/UsuarioController.js

import UsuarioService from '../service/UsuarioService.js';
import {
    UsuarioSchema,
    UsuarioUpdateSchema
} from '../utils/validators/schemas/zod/UsuarioSchema.js';
import {
    UsuarioQuerySchema,
    UsuarioIdSchema
} from '../utils/validators/schemas/zod/querys/UsuarioQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';

class UsuarioController {
    constructor() {
        this.service = new UsuarioService();
    }

    async listar(req, res) {
        const id = req?.params?.id;
        if (id) {
            UsuarioIdSchema.parse(id);
        }

        const query = req?.query;
        if (Object.keys(query).length !== 0) {
            await UsuarioQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        const parsedData = UsuarioSchema.parse(req.body);
        let data = await this.service.criar(parsedData, req);

        let usuarioLimpo = data.toObject();
        delete usuarioLimpo.senha;

        return CommonResponse.created(res, usuarioLimpo);
    }

    async atualizar(req, res) {
        const id = req?.params?.id;
        UsuarioIdSchema.parse(id);

        const parsedData = UsuarioUpdateSchema.parse(req.body);
        const data = await this.service.atualizar(id, parsedData, req);

        let usuarioLimpo = data.toObject();
        delete usuarioLimpo.senha;

        return CommonResponse.success(res, usuarioLimpo, 200, 'Usuário atualizado com sucesso.');
    }

    async atualizarStatus(req, res) {
        const id = req?.params?.id;
        UsuarioIdSchema.parse(id);

        const parsedData = req.body || {};
        const data = await this.service.atualizarStatus(id, parsedData, req);

        return CommonResponse.success(res, data, 200, 'Status do usuário atualizado com sucesso.');
    }

    async deletar(req, res) {
        const id = req?.params?.id;
        UsuarioIdSchema.parse(id);

        if (!id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'id',
                details: [],
                customMessage: 'ID do usuário é obrigatório para deletar.'
            });
        }

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(res, data, 200, 'Usuário excluído com sucesso.');
    }
}

export default UsuarioController;
