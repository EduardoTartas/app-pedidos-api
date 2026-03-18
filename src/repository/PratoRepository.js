// src/repository/PratoRepository.js

import Prato from '../models/Prato.js';
import '../models/AdicionalGrupo.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class PratoRepository {
    constructor({ PratoModel = Prato } = {}) {
        this.modelPrato = PratoModel;
    }

    async buscarPorID(id) {
        const prato = await this.modelPrato.findById(id)
            .populate('adicionais_grupo_ids');
        if (!prato) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: messages.error.resourceNotFound('Prato')
            });
        }
        return prato;
    }

    async listar(req) {
        const { nome, status, secao, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = {};
        if (nome) filtros.nome = { $regex: nome, $options: 'i' };
        if (status) filtros.status = status;
        if (secao) filtros.secao = { $regex: secao, $options: 'i' };

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            populate: [{ path: 'adicionais_grupo_ids' }],
            sort: { secao: 1, nome: 1 },
        };

        const resultado = await this.modelPrato.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async listarPorRestaurante(restauranteId, req) {
        const { nome, status, secao, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = { restaurante_id: restauranteId };
        if (nome) filtros.nome = { $regex: nome, $options: 'i' };
        if (status) filtros.status = status;
        if (secao) filtros.secao = { $regex: secao, $options: 'i' };

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            populate: [{ path: 'adicionais_grupo_ids' }],
            sort: { secao: 1, nome: 1 },
        };

        const resultado = await this.modelPrato.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async buscarCardapio(restauranteId) {
        const pratos = await this.modelPrato.find({
            restaurante_id: restauranteId,
            status: 'ativo'
        }).populate('adicionais_grupo_ids').sort({ secao: 1, nome: 1 });
        return pratos;
    }

    async criar(dadosPrato) {
        const prato = new this.modelPrato(dadosPrato);
        return await prato.save();
    }

    async atualizar(id, parsedData) {
        const prato = await this.modelPrato.findByIdAndUpdate(id, parsedData, { returnDocument: 'after' })
            .populate('adicionais_grupo_ids');
        if (!prato) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: messages.error.resourceNotFound('Prato')
            });
        }
        return prato;
    }

    async deletar(id) {
        const prato = await this.modelPrato.findByIdAndDelete(id);
        if (!prato) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Prato',
                details: [],
                customMessage: messages.error.resourceNotFound('Prato')
            });
        }
        return prato;
    }
}

export default PratoRepository;
