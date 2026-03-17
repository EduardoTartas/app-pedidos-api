// src/service/RestauranteService.js

import {
    CustomError,
    HttpStatusCodes,
    messages,
    ensurePermission
} from '../utils/helpers/index.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import UploadService from './UploadService.js';
import Categoria from '../models/Categoria.js';
import { cnpj } from 'cpf-cnpj-validator';

class RestauranteService {
    constructor() {
        this.repository = new RestauranteRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.uploadService = new UploadService();
    }

    async listar(req) {
        const data = await this.repository.listar(req);
        return data;
    }

    async criar(parsedData, req) {
        // Validar se user_id está presente na requisição
        if (!req.user_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'unauthorized',
                field: 'Autenticação',
                details: [],
                customMessage: 'Usuário não autenticado. Faça login para criar um restaurante.',
            });
        }

        // Verificar se o usuário dono existe
        await this.ensureUsuarioExists(req.user_id);

        // Verificar se já existe um restaurante com o mesmo nome
        await this.ensureNomeUnico(parsedData.nome);

        // Verificar se as categorias informadas existem
        if (parsedData.categoria_ids && parsedData.categoria_ids.length > 0) {
            await this.ensureCategoriasExistem(parsedData.categoria_ids);
        }

        // Validar e verificar unicidade do CNPJ se fornecido
        if (parsedData.cnpj) {
            await this.validateCnpj(parsedData.cnpj);
        }

        // Definir o dono_id como o usuário logado
        parsedData.dono_id = req.user_id;

        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Restaurante',
            customMessage: 'Você não tem permissões para editar este restaurante.',
        });

        // Verificar nome duplicado (se está tentando alterar o nome)
        if (parsedData.nome) {
            await this.ensureNomeUnico(parsedData.nome, id);
        }

        // Verificar se as categorias informadas existem
        if (parsedData.categoria_ids && parsedData.categoria_ids.length > 0) {
            await this.ensureCategoriasExistem(parsedData.categoria_ids);
        }

        // Validar e verificar unicidade do CNPJ se fornecido
        if (parsedData.cnpj) {
            await this.validateCnpj(parsedData.cnpj, id);
        }

        // Não permitir alterar o dono_id
        delete parsedData.dono_id;

        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Restaurante',
            customMessage: 'Você não tem permissões para deletar este restaurante.',
        });

        const data = await this.repository.deletar(id);
        return data;
    }

    async fotoUpload(id, file, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id ?._id || restaurante.dono_id);
        ensurePermission({
          usuarioLogado,
          targetId: donoId,
          field: 'Restaurante',
          customMessage: 'Você não tem permissões para alterar a foto deste restaurante.',
        });

        // O 'processarImagem' já
        const uploadResult = await this.uploadService.substituirImagem(
          file,
          restaurante.foto_restaurante,
          { fit: 'cover', quality: 80 }
        );

        // Atualiza a URL no banco de dados
        await this.repository.atualizar(id, { foto_restaurante: uploadResult.url });

        return uploadResult;
    }

    async fotoDelete(id, req) {
      const restaurante = await this.ensureRestauranteExists(id);

      const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
      const donoId = String(restaurante.dono_id ?._id || restaurante.dono_id);
      ensurePermission({
        usuarioLogado,
        targetId: donoId,
        field: 'Restaurante',
        customMessage: 'Você não tem permissões para deletar a foto deste restaurante.',
      });

      if(!restaurante.foto_restaurante) {
        throw new CustomError({
          statusCode: HttpStatusCodes.NOT_FOUND.code,
          errorType: 'resourceNotFound',
          field: 'foto_restaurante',
          customMessage: 'Este restaurante não possui uma foto para remover.',
        });
      }

      const urlAntiga = restaurante.foto_restaurante;

      // 1. Remove a URL do banco de dados imediatamente (resposta rápida, evita carregamento desnecessário da imagem)
      await this.repository.atualizar(id, { foto_restaurante: "" });

      // 2. Deleta do Garage em background com retry (se falhar, apenas loga e não impacta o usuário)
      this.uploadService.deleteImagemComRetry(urlAntiga).catch(err => {
          console.error(`Erro isolado na exclusão da foto em background: ${err.message}`);
      });

      return true;
    }

    // === Métodos auxiliares de validação ===

    async ensureRestauranteExists(id) {
        const restauranteExistente = await this.repository.buscarPorID(id);
        if (!restauranteExistente) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Restaurante',
                details: [],
                customMessage: messages.error.resourceNotFound('Restaurante'),
            });
        }
        return restauranteExistente;
    }

    async ensureUsuarioExists(userId) {
        try {
            const usuario = await this.usuarioRepository.buscarPorID(userId);
            if (!usuario) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Usuário',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Usuário'),
                });
            }
            return usuario;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: 'O usuário informado não foi encontrado.',
            });
        }
    }

    async ensureNomeUnico(nome, idIgnorado = null) {
        const restauranteExistente = await this.repository.buscarPorNome(nome, idIgnorado);
        if (restauranteExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'duplicateEntry',
                field: 'nome',
                details: [{ path: 'nome', message: `Já existe um restaurante com o nome "${nome}".` }],
                customMessage: `Já existe um restaurante com o nome "${nome}".`,
            });
        }
    }

    async ensureCategoriasExistem(categoriaIds) {
        const categoriasEncontradas = await Categoria.find({ _id: { $in: categoriaIds } });
        if (categoriasEncontradas.length !== categoriaIds.length) {
            const idsEncontrados = categoriasEncontradas.map(c => String(c._id));
            const idsNaoEncontrados = categoriaIds.filter(id => !idsEncontrados.includes(String(id)));
            throw new CustomError({
                statusCode: 400,
                errorType: 'validationError',
                field: 'categoria_ids',
                details: idsNaoEncontrados.map(id => ({
                    path: 'categoria_ids',
                    message: `Categoria com ID "${id}" não foi encontrada.`
                })),
                customMessage: `${idsNaoEncontrados.length} categoria(s) informada(s) não foram encontradas.`,
            });
        }
    }

    async validateCnpj(cnpjValue, id = null) {
        if (!this.isValidCnpj(cnpjValue)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'cnpj',
                details: [{ path: 'cnpj', message: 'CNPJ inválido.' }],
                customMessage: 'CNPJ inválido.',
            });
        }

        const restauranteExistente = await this.repository.buscarPorCnpj(cnpjValue, id);
        if (restauranteExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'duplicateEntry',
                field: 'cnpj',
                details: [{ path: 'cnpj', message: 'CNPJ já está em uso.' }],
                customMessage: 'CNPJ já cadastrado.',
            });
        }
    }

    isValidCnpj(cnpjValue) {
        const cleaned = cnpjValue.replace(/\D/g, '');
        return cleaned.length === 14 && cnpj.isValid(cleaned);
    }
}

export default RestauranteService;
