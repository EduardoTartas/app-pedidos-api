// src/controllers/RestauranteController.js

import RestauranteService from '../service/RestauranteService.js';
import {
  RestauranteSchema,
  RestauranteUpdateSchema,
} from '../utils/validators/schemas/zod/RestauranteSchema.js';
import {
  RestauranteIdSchema,
  RestauranteQuerySchema,
} from '../utils/validators/schemas/zod/querys/RestauranteQuerySchema.js';
import {
  CommonResponse,
  CustomError,
  HttpStatusCodes,
} from '../utils/helpers/index.js';
class RestauranteController {
  constructor() {
    this.service = new RestauranteService();
  }

  async listar(req, res) {
    const { id } = req.params;
    if (id) {
      RestauranteIdSchema.parse(id);
    }

    const query = req?.query;
    if (Object.keys(query).length !== 0) {
      await RestauranteQuerySchema.parseAsync(query);
    }

    const data = await this.service.listar(req);

    // Mensagem contextualizada para listagem
    if (id) {
      return CommonResponse.success(
        res,
        data,
        HttpStatusCodes.OK.code,
        'Restaurante encontrado com sucesso.',
      );
    }

    // Resultado paginado - verificar se há resultados
    const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
    if (totalDocs === 0) {
      const temFiltros =
        query && (query.nome || query.categoria || query.status);
      const mensagem = temFiltros
        ? 'Nenhum restaurante encontrado com os filtros informados.'
        : 'Nenhum restaurante cadastrado.';
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
      `${totalDocs} restaurante(s) encontrado(s).`,
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
          'O corpo da requisição é obrigatório para criar um restaurante.',
      });
    }

    const parsedData = RestauranteSchema.parse(req.body);
    const data = await this.service.criar(parsedData, req);
    return CommonResponse.created(res, data, 'Restaurante criado com sucesso.');
  }

  async atualizar(req, res) {
    const { id } = req.params;
    RestauranteIdSchema.parse(id);

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
          'Informe pelo menos um campo para atualizar o restaurante.',
      });
    }

    const parsedData = RestauranteUpdateSchema.parse(req.body);
    const data = await this.service.atualizar(id, parsedData, req);
    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Restaurante atualizado com sucesso.',
    );
  }

  async deletar(req, res) {
    const { id } = req.params;
    RestauranteIdSchema.parse(id);

    if (!id) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'validationError',
        field: 'id',
        details: [
          {
            path: 'id',
            message: 'O ID do restaurante é obrigatório.',
          },
        ],
        customMessage: 'ID do restaurante é obrigatório para deletar.',
      });
    }

    const data = await this.service.deletar(id, req);
    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Restaurante excluído com sucesso.',
    );
  }
}

export default RestauranteController;
