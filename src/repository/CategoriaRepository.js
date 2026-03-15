// src/repository/CategoriaRepository.js

import Categoria from '../models/Categoria.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class CategoriaRepository {
    constructor({ CategoriaModel = Categoria } = {}) {
        this.modelCategoria = CategoriaModel;
    }

    async buscarPorID(id) {
        const categoria = await this.modelCategoria.findById(id);
        if (!categoria) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: messages.error.resourceNotFound('Categoria')
            });
        }
        return categoria;
    }

    async buscarPorNome(nome, idIgnorado = null) {
        const filtro = { nome };
        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }
        const documento = await this.modelCategoria.findOne(filtro);
        return documento;
    }

    async listar(req) {
        const { id } = req.params;
        if (id) {
            const data = await this.modelCategoria.findById(id);
            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Categoria',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Categoria')
                });
            }
            return data;
        }

        const { nome, ativo, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = {};
        if (nome) filtros.nome = { $regex: nome, $options: 'i' };
        if (ativo !== undefined) filtros.ativo = ativo === 'true';

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            sort: { nome: 1 },
        };

        const resultado = await this.modelCategoria.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async criar(dadosCategoria) {
        const categoria = new this.modelCategoria(dadosCategoria);
        return await categoria.save();
    }

    async atualizar(id, parsedData) {
        const categoria = await this.modelCategoria.findByIdAndUpdate(id, parsedData, { new: true });
        if (!categoria) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: messages.error.resourceNotFound('Categoria')
            });
        }
        return categoria;
    }

    async deletar(id) {
        const categoria = await this.modelCategoria.findByIdAndDelete(id);
        return categoria;
    }
}

export default CategoriaRepository;
