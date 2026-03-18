// src/repository/RestauranteRepository.js

import Restaurante from '../models/Restaurante.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class RestauranteRepository {
    constructor({ RestauranteModel = Restaurante } = {}) {
        this.modelRestaurante = RestauranteModel;
    }

    async buscarPorID(id) {
        const restaurante = await this.modelRestaurante.findById(id)
            .populate('categoria_ids')
            .populate('dono_id', 'nome email');
        if (!restaurante) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Restaurante',
                details: [],
                customMessage: messages.error.resourceNotFound('Restaurante')
            });
        }
        return restaurante;
    }

    async buscarPorNome(nome, idIgnorado = null) {
        const filtro = { nome };
        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }
        const documento = await this.modelRestaurante.findOne(filtro);
        return documento;
    }

    async buscarPorCnpj(cnpjValue, idIgnorado = null) {
        const filtro = { cnpj: cnpjValue };
        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }
        const documento = await this.modelRestaurante.findOne(filtro);
        return documento;
    }

    async buscarPorDonoId(donoId) {
        const restaurantes = await this.modelRestaurante.find({ dono_id: donoId })
            .populate('categoria_ids');
        return restaurantes;
    }

    async listar(req) {
        const { id } = req.params;
        const dono_id = req.query?.dono_id; // Pega o dono_id se injetado pelas camadas superiores

        if (id) {
            const filtroId = { _id: id };
            if (dono_id) filtroId.dono_id = dono_id;

            const data = await this.modelRestaurante.findOne(filtroId)
                .populate('categoria_ids')
                .populate('dono_id', 'nome email');
            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Restaurante',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Restaurante')
                });
            }
            return data;
        }

        const { nome, categoria, status, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = {};
        if (nome) filtros.nome = { $regex: nome, $options: 'i' };
        if (categoria) filtros.categoria_ids = { $in: [categoria] };
        if (status) filtros.status = status;
        if (dono_id) filtros.dono_id = dono_id;

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            populate: [
                { path: 'categoria_ids' },
                { path: 'dono_id', select: 'nome email' }
            ],
            sort: { nome: 1 },
        };

        const resultado = await this.modelRestaurante.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async criar(dadosRestaurante) {
        const restaurante = new this.modelRestaurante(dadosRestaurante);
        return await restaurante.save();
    }

    async atualizar(id, parsedData) {
        const restaurante = await this.modelRestaurante.findByIdAndUpdate(id, parsedData, { returnDocument: 'after' })
            .populate('categoria_ids')
            .populate('dono_id', 'nome email');
        if (!restaurante) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Restaurante',
                details: [],
                customMessage: messages.error.resourceNotFound('Restaurante')
            });
        }
        return restaurante;
    }

    async deletar(id) {
        const restaurante = await this.modelRestaurante.findByIdAndDelete(id);
        if (!restaurante) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Restaurante',
                details: [],
                customMessage: messages.error.resourceNotFound('Restaurante')
            });
        }
        return restaurante;
    }
}

export default RestauranteRepository;
