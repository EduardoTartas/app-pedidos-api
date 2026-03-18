// src/service/PratoService.js

import {
    CustomError,
    HttpStatusCodes,
    messages,
    ensurePermission
} from '../utils/helpers/index.js';
import PratoRepository from '../repository/PratoRepository.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import UploadService from './UploadService.js';

class PratoService {
    constructor() {
        this.repository = new PratoRepository();
        this.restauranteRepository = new RestauranteRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.uploadService = new UploadService();
    }

    async listar(req) {
        const data = await this.repository.listar(req);
        return data;
    }

    async buscarCardapio(restauranteId) {
        // Verifica se o restaurante existe
        await this.ensureRestauranteExists(restauranteId);

        const pratos = await this.repository.buscarCardapio(restauranteId);

        // Agrupar por seção do cardápio
        const cardapio = {};
        pratos.forEach(prato => {
            const secao = prato.secao || 'Geral';
            if (!cardapio[secao]) {
                cardapio[secao] = [];
            }
            cardapio[secao].push(typeof prato.toObject === 'function' ? prato.toObject() : prato);
        });

        return cardapio;
    }

    async listarPorRestaurante(restauranteId, req) {
        await this.ensureRestauranteExists(restauranteId);
        const data = await this.repository.listarPorRestaurante(restauranteId, req);
        return data;
    }

    async criar(parsedData, req) {
        // Verificar se o restaurante existe
        const restaurante = await this.ensureRestauranteExists(parsedData.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Prato',
            customMessage: 'Você não tem permissões para cadastrar pratos neste restaurante.',
        });

        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData, req) {
        const prato = await this.ensurePratoExists(id);
        const restaurante = await this.ensureRestauranteExists(prato.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Prato',
            customMessage: 'Você não tem permissões para editar pratos deste restaurante.',
        });

        // Não permitir alterar restaurante_id
        delete parsedData.restaurante_id;

        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id, req) {
        const prato = await this.ensurePratoExists(id);
        const restaurante = await this.ensureRestauranteExists(prato.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Prato',
            customMessage: 'Você não tem permissões para deletar pratos deste restaurante.',
        });

        const data = await this.repository.deletar(id);
        return data;
    }

    // ================================
    // UPLOAD DE FOTO
    // ================================
    async fotoUpload(id, file, req) {
        const prato = await this.repository.buscarPorID(id);

        if (!prato) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: 'Prato não encontrado.',
            });
        }

        const restaurante = await this.ensureRestauranteExists(prato.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Prato',
            customMessage: 'Você não tem permissões para alterar a foto deste prato.',
        });

        // O 'substituirImagem' já trata se 'prato.foto_prato' for null ou se não existir
        const uploadResult = await this.uploadService.substituirImagem(
            file,
            prato.foto_prato,
            { width: 800, height: 800, fit: 'cover', quality: 80 }
        );

        // Atualiza a URL no banco de dados
        await this.repository.atualizar(id, { foto_prato: uploadResult.url });

        return uploadResult;
    }

    async fotoDelete(id, req) {
        const prato = await this.repository.buscarPorID(id);

        if (!prato) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: 'Prato não encontrado.',
            });
        }

        const restaurante = await this.ensureRestauranteExists(prato.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Prato',
            customMessage: 'Você não tem permissões para excluir a foto deste prato.',
        });

        if (!prato.foto_prato) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: 'Este prato não possui uma foto para remover.',
            });
        }

        const urlAntiga = prato.foto_prato;

      // 1. Remove a URL do banco de dados imediatamente (resposta rápida, evita carregamento desnecessário da imagem)
      await this.repository.atualizar(id, { foto_prato: "" });

      // 2. Deleta do Garage em background com retry (se falhar, apenas loga e não impacta o usuário)
      this.uploadService.deleteImagemComRetry(urlAntiga).catch(err => {
          console.error(`Erro isolado na exclusão da foto em background: ${err.message}`);
      });

      return true;
    }

    // === Métodos auxiliares de validação ===

    async ensurePratoExists(id) {
        const prato = await this.repository.buscarPorID(id);
        if (!prato) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: messages.error.resourceNotFound('Prato'),
            });
        }
        return prato;
    }

    async ensureRestauranteExists(restauranteId) {
        const restaurante = await this.restauranteRepository.buscarPorID(restauranteId);
        if (!restaurante) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Restaurante',
                details: [],
                customMessage: messages.error.resourceNotFound('Restaurante'),
            });
        }
        return restaurante;
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
}

export default PratoService;
