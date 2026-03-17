// src/service/CategoriaService.js

import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import CategoriaRepository from '../repository/CategoriaRepository.js';

class CategoriaService {
    constructor() {
        this.repository = new CategoriaRepository();
    }

    //TODO: VALIDAÇÃO DE PERMISSÃO PARA SOMENTE ADMINISTRADORES PODEREM GERENCIAR CATEGORIAS!!!
    async listar(req) {
        const data = await this.repository.listar(req);
        return data;
    }

    async criar(parsedData) {
        await this.validarNome(parsedData.nome);
        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData) {
        await this.ensureCategoriaExists(id);
        if (parsedData.nome) {
            await this.validarNome(parsedData.nome, id);
        }
        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id) {
        await this.ensureCategoriaExists(id);
        const data = await this.repository.deletar(id);
        return data;
    }

    async ensureCategoriaExists(id) {
        const categoriaExistente = await this.repository.buscarPorID(id);
        if (!categoriaExistente) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: messages.error.resourceNotFound('Categoria'),
            });
        }
        return categoriaExistente;
    }

    async validarNome(nome, id = null) {
        const categoriaExistente = await this.repository.buscarPorNome(nome, id);
        if (categoriaExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'nome',
                details: [{ path: 'nome', message: 'Nome já está em uso.' }],
                customMessage: 'O nome informado já está sendo utilizado por outra categoria.',
            });
        }
    }
}

export default CategoriaService;
