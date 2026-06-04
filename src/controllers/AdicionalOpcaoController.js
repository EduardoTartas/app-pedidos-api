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
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Opção de adicional atualizada com sucesso.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.deletar(id, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Opção de adicional excluída com sucesso.');
    }

    async fotoUpload(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const file = req.files?.file || req.files?.imagem;
        if (!file) {
          throw new CustomError({
              statusCode: HttpStatusCodes.BAD_REQUEST.code,
              errorType: 'validationError',
              field: 'file',
              details: [{ path: 'file', message: 'Nenhum arquivo enviado.' }],
              customMessage: 'A imagem é obrigatória para o upload.',
          });
        }

        const { url, fileName, metadata } = await this.service.fotoUpload(id, file, req);

        return CommonResponse.success(res, {
          message: 'Foto processada e adicional atualizado com sucesso.',
          dados: { foto_adicional: url },
          metadados: metadata,
        });
    }

    async fotoDelete(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        await this.service.fotoDelete(id, req);

        return CommonResponse.success(
          res,
          null,
          HttpStatusCodes.OK.code,
          'Foto do adicional excluída com sucesso.',
        );
    }
}

export default AdicionalOpcaoController;
