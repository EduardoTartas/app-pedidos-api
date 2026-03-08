// src/repository/EnderecoRepository.js

import Endereco from '../models/Endereco.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class EnderecoRepository {
    constructor({ EnderecoModel = Endereco } = {}) {
        this.modelEndereco = EnderecoModel;
    }

    async buscarPorID(id) {
        const endereco = await this.modelEndereco.findById(id);
        if (!endereco) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Endereço',
                details: [],
                customMessage: messages.error.resourceNotFound('Endereço')
            });
        }
        return endereco;
    }

    async listarPorUsuario(usuarioId) {
        return await this.modelEndereco.find({ usuario_id: usuarioId }).sort({ principal: -1, createdAt: -1 });
    }

    async buscarPorRestaurante(restauranteId) {
        return await this.modelEndereco.findOne({ restaurante_id: restauranteId });
    }

    async criar(dadosEndereco) {
        const endereco = new this.modelEndereco(dadosEndereco);
        return await endereco.save();
    }

    async atualizar(id, parsedData) {
        const endereco = await this.modelEndereco.findByIdAndUpdate(id, parsedData, { new: true });
        if (!endereco) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Endereço',
                details: [],
                customMessage: messages.error.resourceNotFound('Endereço')
            });
        }
        return endereco;
    }

    async deletar(id) {
        const endereco = await this.modelEndereco.findByIdAndDelete(id);
        if (!endereco) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Endereço',
                details: [],
                customMessage: messages.error.resourceNotFound('Endereço')
            });
        }
        return endereco;
    }

    async desmarcarPrincipal(usuarioId) {
        await this.modelEndereco.updateMany(
            { usuario_id: usuarioId, principal: true },
            { principal: false }
        );
    }
}

export default EnderecoRepository;
