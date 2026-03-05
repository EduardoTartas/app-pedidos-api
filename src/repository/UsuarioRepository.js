// src/repository/UsuarioRepository.js

import Usuario from '../models/Usuario.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class UsuarioRepository {
    constructor({ usuarioModel = Usuario } = {}) {
        this.modelUsuario = usuarioModel;
    }

    async armazenarTokens(id, accesstoken, refreshtoken) {
        const document = await this.modelUsuario.findById(id);
        if (!document) {
            throw new CustomError({
                statusCode: 401,
                errorType: "resourceNotFound",
                field: "Usuário",
                details: [],
                customMessage: messages.error.resourceNotFound("Usuário")
            });
        }
        document.accesstoken = accesstoken;
        document.refreshtoken = refreshtoken;
        const data = document.save();
        return data;
    }

    async removerTokens(id) {
        const parsedData = {
            refreshtoken: null,
            accesstoken: null
        };
        const usuario = await this.modelUsuario.findByIdAndUpdate(id, parsedData, { new: true }).exec();
        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: "Usuário",
                details: [],
                customMessage: messages.error.resourceNotFound("Usuário")
            });
        }
        return usuario;
    }

    async buscarPorID(id, includeTokens = false) {
        let query = this.modelUsuario.findById(id);
        if (includeTokens) {
            query = query.select('+refreshtoken +accesstoken');
        }
        const user = await query;
        if (!user) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return user;
    }

    async buscarPorEmail(email, idIgnorado = null) {
        const filtro = { email };
        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }
        const documento = await this.modelUsuario.findOne(filtro).select('+senha');
        return documento;
    }

    async buscarPorCpfCnpj(cpf_cnpj, idIgnorado = null) {
        const filtro = { cpf_cnpj };
        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }
        const documento = await this.modelUsuario.findOne(filtro).select('+senha');
        return documento;
    }

    async listar(req) {
        const { id } = req.params;
        if (id) {
            const data = await this.modelUsuario.findById(id);
            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Usuário',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Usuário')
                });
            }
            return data;
        }

        const { nome, email, status, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = {};
        if (nome) filtros.nome = { $regex: nome, $options: 'i' };
        if (email) filtros.email = { $regex: email, $options: 'i' };
        if (status) filtros.status = status;

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            sort: { nome: 1 },
        };

        const resultado = await this.modelUsuario.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async criar(dadosUsuario) {
        const usuario = new this.modelUsuario(dadosUsuario);
        const usuarioSalvo = await usuario.save();
        return usuarioSalvo;
    }

    async atualizar(id, parsedData) {
        const usuario = await this.modelUsuario.findByIdAndUpdate(id, parsedData, { new: true });
        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return usuario;
    }

    async deletar(id) {
        const usuario = await this.modelUsuario.findByIdAndDelete(id);
        return usuario;
    }

    async buscarPorTokenUnico(tokenUnico) {
        const filtro = { tokenUnico };
        const documento = await this.modelUsuario.findOne(filtro)
            .select('+tokenUnico +exp_codigo_recupera_senha +senha');
        return documento;
    }

    async atualizarSenha(id, senhaHasheada) {
        const usuario = await this.modelUsuario.findByIdAndUpdate(
            id,
            {
                senha: senhaHasheada,
                tokenUnico: null,
                codigo_recupera_senha: null,
                exp_codigo_recupera_senha: null
            },
            { new: true }
        );
        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return usuario;
    }
}

export default UsuarioRepository;
