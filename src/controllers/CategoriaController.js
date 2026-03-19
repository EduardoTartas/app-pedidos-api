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

    async fotoUpload(req, res) {
      const { id } = req.params;
      IdSchema.parse(id);

      const file = req?.files?.file || req?.files?.imagem;
      if (!file) {
          throw new CustomError({
              statusCode: HttpStatusCodes.BAD_REQUEST.code,
              errorType: 'validationError',
              field: 'file',
              details: [],
              customMessage: 'Nenhum arquivo de imagem enviado para upload.',
          });
      }

      const { url, filename, metadata } = await this.service.fotoUpload(id, file, req);

      return CommonResponse.success( res, {
          message: 'Ícone da categoria atualizado com sucesso.',
          dados: { icone_categoria: url },
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
        'Ícone da categoria removido com sucesso.',
      );
    }
}

export default CategoriaController;
