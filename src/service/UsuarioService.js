// src/service/UsuarioService.js

import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import AuthHelper from '../utils/AuthHelper.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';

class UsuarioService {
    constructor() {
        this.repository = new UsuarioRepository();
    }

    async listar(req) {
        const data = await this.repository.listar(req);
        return data;
    }

    async criar(parsedData) {
        // Validar email único
        await this.validateEmail(parsedData.email);

        // Validar cpf_cnpj único se fornecido
        if (parsedData.cpf_cnpj) {
            await this.validateCpfCnpj(parsedData.cpf_cnpj);
        }

        // Hash da senha
        if (parsedData.senha) {
            parsedData.senha = await AuthHelper.hashPassword(parsedData.senha);
        }

        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData, req) {
        // Não permitir alterar email e senha por esta rota
        delete parsedData.email;
        delete parsedData.senha;

        await this.ensureUserExists(id);

        // Verificar se o usuário está atualizando a si mesmo ou é admin
        const usuarioLogado = await this.repository.buscarPorID(req.user_id);
        const isAdmin = usuarioLogado.isAdmin;
        const atualizarOutroUser = String(usuarioLogado._id) !== String(id);

        if (!isAdmin && atualizarOutroUser) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Usuário',
                details: [],
                customMessage: "Você não tem permissões para atualizar outro usuário."
            });
        }

        // Não permitir alterar isAdmin se não for admin
        if (!isAdmin) {
            delete parsedData.isAdmin;
        }

        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async atualizarStatus(id, parsedData, req) {
        await this.ensureUserExists(id);

        const usuarioLogado = await this.repository.buscarPorID(req.user_id);
        const isAdmin = usuarioLogado.isAdmin;
        const atualizarPropriaConta = String(usuarioLogado._id) === String(id);

        // Somente admin ou o próprio usuário podem alterar status
        if (!isAdmin && !atualizarPropriaConta) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Usuário',
                details: [],
                customMessage: "Você não tem permissões para alterar o status deste usuário."
            });
        }

        const data = await this.repository.atualizar(id, { status: parsedData.status });
        return data;
    }

    async deletar(id, req) {
        const usuarioLogado = await this.repository.buscarPorID(req.user_id);
        const isAdmin = usuarioLogado.isAdmin;

        await this.ensureUserExists(id);

        if (!isAdmin && String(usuarioLogado._id) !== String(id)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Usuário',
                details: [],
                customMessage: "Você só pode deletar sua própria conta."
            });
        }

        const data = await this.repository.deletar(id);
        return data;
    }

    // ================================
    // MÉTODOS UTILITÁRIOS
    // ================================
    async validateEmail(email, id = null) {
        const usuarioExistente = await this.repository.buscarPorEmail(email, id);
        if (usuarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'email',
                details: [{ path: 'email', message: 'Email já está em uso.' }],
                customMessage: 'Email já cadastrado.',
            });
        }
    }

    async validateCpfCnpj(cpf_cnpj, id = null) {
        const usuarioExistente = await this.repository.buscarPorCpfCnpj(cpf_cnpj, id);
        if (usuarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'cpf_cnpj',
                details: [{ path: 'cpf_cnpj', message: 'CPF/CNPJ já está em uso.' }],
                customMessage: 'CPF/CNPJ já cadastrado.',
            });
        }
    }

    async ensureUserExists(id) {
        const usuarioExistente = await this.repository.buscarPorID(id);
        if (!usuarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: 'Usuário não encontrado.'
            });
        }
        return usuarioExistente;
    }
}

export default UsuarioService;
