// src/service/RestauranteService.js

import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import Categoria from '../models/Categoria.js';

class RestauranteService {
    constructor() {
        this.repository = new RestauranteRepository();
        this.usuarioRepository = new UsuarioRepository();
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

        // Definir o dono_id como o usuário logado
        parsedData.dono_id = req.user_id;

        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        // Validar se user_id está presente na requisição
        if (!req.user_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'unauthorized',
                field: 'Autenticação',
                details: [],
                customMessage: 'Usuário não autenticado. Faça login para atualizar um restaurante.',
            });
        }

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const isAdmin = usuarioLogado.isAdmin;
        const isDono = String(restaurante.dono_id._id || restaurante.dono_id) === String(req.user_id);

        if (!isAdmin && !isDono) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Restaurante',
                details: [],
                customMessage: "Você não tem permissões para editar este restaurante."
            });
        }

        // Verificar nome duplicado (se está tentando alterar o nome)
        if (parsedData.nome) {
            await this.ensureNomeUnico(parsedData.nome, id);
        }

        // Verificar se as categorias informadas existem
        if (parsedData.categoria_ids && parsedData.categoria_ids.length > 0) {
            await this.ensureCategoriasExistem(parsedData.categoria_ids);
        }

        // Não permitir alterar o dono_id
        delete parsedData.dono_id;

        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        // Validar se user_id está presente na requisição
        if (!req.user_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'unauthorized',
                field: 'Autenticação',
                details: [],
                customMessage: 'Usuário não autenticado. Faça login para deletar um restaurante.',
            });
        }

        const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
        const isAdmin = usuarioLogado.isAdmin;
        const isDono = String(restaurante.dono_id._id || restaurante.dono_id) === String(req.user_id);

        if (!isAdmin && !isDono) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Restaurante',
                details: [],
                customMessage: "Você não tem permissões para deletar este restaurante."
            });
        }

        const data = await this.repository.deletar(id);
        return data;
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
}

export default RestauranteService;
