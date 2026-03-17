// src/repository/AdicionalOpcaoRepository.js

import AdicionalOpcao from '../models/AdicionalOpcao.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class AdicionalOpcaoRepository {
    constructor({ AdicionalOpcaoModel = AdicionalOpcao } = {}) {
        this.modelAdicionalOpcao = AdicionalOpcaoModel;
    }

    async buscarPorID(id) {
        const opcao = await this.modelAdicionalOpcao.findById(id);
        if (!opcao) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Opção de Adicional',
                details: [],
                customMessage: messages.error.resourceNotFound('Opção de Adicional')
            });
        }
        return opcao;
    }

    async listarPorGrupo(grupoId) {
        const opcoes = await this.modelAdicionalOpcao.find({
            grupo_id: grupoId,
            ativo: true
        }).sort({ nome: 1 });
        return opcoes;
    }

    async buscarPorNomeNoGrupo(nome, grupoId, idIgnorado = null) {
        const filtro = { nome, grupo_id: grupoId };
        if (idIgnorado) filtro._id = { $ne: idIgnorado };
        return await this.modelAdicionalOpcao.findOne(filtro);
    }

    async buscarPorIDs(ids) {
        return await this.modelAdicionalOpcao.find({ _id: { $in: ids } });
    }

    async criar(dadosOpcao) {
        const opcao = new this.modelAdicionalOpcao(dadosOpcao);
        return await opcao.save();
    }

    async atualizar(id, parsedData) {
        const opcao = await this.modelAdicionalOpcao.findByIdAndUpdate(id, parsedData, { new: true });
        if (!opcao) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Opção de Adicional',
                details: [],
                customMessage: messages.error.resourceNotFound('Opção de Adicional')
            });
        }
        return opcao;
    }

    async deletar(id) {
        const opcao = await this.modelAdicionalOpcao.findByIdAndDelete(id);
        return opcao;
    }

    async deletarPorGrupo(grupoId) {
        return await this.modelAdicionalOpcao.deleteMany({ grupo_id: grupoId });
    }
}

export default AdicionalOpcaoRepository;
