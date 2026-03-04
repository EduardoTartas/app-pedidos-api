// src/service/RestauranteService.js

import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';

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
        // Definir o dono_id como o usuário logado
        parsedData.dono_id = req.user_id;

        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
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

        // Não permitir alterar o dono_id
        delete parsedData.dono_id;

        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id, req) {
        const restaurante = await this.ensureRestauranteExists(id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
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
}

export default RestauranteService;
