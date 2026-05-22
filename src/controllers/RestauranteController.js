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

    let query = req?.query || {};
    if (Object.keys(query).length !== 0) {
      query = await RestauranteQuerySchema.parseAsync(query);
    }

    const data = await this.service.listar({ params: req.params, query });

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
      const { nome, categoria, status, entrega_gratis, avaliacao_min, ordenar } = query;
      const temFiltros = nome || categoria || status || entrega_gratis || avaliacao_min || ordenar;
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

  async listarMeus(req, res) {
    let query = req?.query || {};
    if (Object.keys(query).length !== 0) {
      query = await RestauranteQuerySchema.parseAsync(query);
    }

    const data = await this.service.listarMeus({
      params: req.params,
      query,
      user_id: req.user_id,
    });

    const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
    if (totalDocs === 0) {
      return CommonResponse.success(
        res,
        data,
        HttpStatusCodes.OK.code,
        'Nenhum restaurante encontrado sob sua gestão.',
      );
    }

    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      `${totalDocs} restaurante(s) encontrado(s) sob sua gestão.`,
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

  async fotoUpload(req, res) {
    const { id } = req.params;
    RestauranteIdSchema.parse(id);

    const file = req.files?.file || req.files?.imagem;
    if(!file) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'validationError',
        field: 'file',
        details: [{ path: 'file', message: 'Nenhum arquivo enviado.' }],
        customMessage: 'A imagem é obrigatória para o upload.',
      });
    }

    const { url, fileName, metadata } = await this.service.fotoUpload(id, file, req);

    return CommonResponse.success( res, {
      message: 'Foto processada e restaurante atualizado com sucesso.',
      dados: { foto_restaurante: url },
      metadados: metadata,
    });
  }

  async fotoDelete(req, res) {
    const { id } = req.params;
    RestauranteIdSchema.parse(id);

    await this.service.fotoDelete(id, req);

    return CommonResponse.success(
      res,
      null,
      HttpStatusCodes.OK.code,
      'Foto do restaurante excluída com sucesso.',
    )
  }
}

export default RestauranteController;
