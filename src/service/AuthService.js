// src/service/AuthService.js

import EmailService from './EmailService.js';
import { OAuth2Client } from 'google-auth-library';

import jwt from 'jsonwebtoken';
import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import tokenUtil from '../utils/TokenUtil.js';
import bcrypt from 'bcryptjs';
import AuthHelper from '../utils/AuthHelper.js';
import UsuarioRepository from "../repository/UsuarioRepository.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    constructor(params = {}) {
        const { tokenUtil: injectedToken } = params;
        this.TokenUtil = injectedToken || tokenUtil;
        this.repository = new UsuarioRepository();
    }

    async carregatokens(id) {
        const data = await this.repository.buscarPorID(id, true);
        return { data };
    }

    async login(body) {
        const email = body.email || body.email.trim().toLowerCase();
        const userEncontrado = await this.repository.buscarPorEmail(email);
        if (!userEncontrado) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'notFound',
                field: "Email",
                details: [],
                customMessage: messages.error.unauthorized("Credenciais inválidas")
            });
        }

        // Verificar se o status do usuário é ativo
        if (userEncontrado.status === 'inativo') {
            throw new CustomError({
                statusCode: 403,
                errorType: 'forbidden',
                field: 'Status',
                details: [],
                customMessage: 'Conta desativada. Entre em contato com o suporte.'
            });
        }

        // Verificar se a conta é Google-only (sem senha)
        if (!userEncontrado.senha) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'googleOnly',
                field: 'Senha',
                details: [],
                customMessage: 'Esta conta utiliza login com Google. Use o botão "Entrar com Google".'
            });
        }

        const senhaValida = await bcrypt.compare(body.senha, userEncontrado.senha);
        if (!senhaValida) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'notFound',
                field: 'Senha',
                details: [],
                customMessage: messages.error.unauthorized('Credenciais inválidas')
            });
        }

        // Gerar novo access token
        const accessToken = await this.TokenUtil.generateAccessToken(userEncontrado._id);

        // Verificar refresh token existente
        const userComToken = await this.repository.buscarPorID(userEncontrado._id, true);
        let refreshtoken = userComToken.refreshtoken;

        if (refreshtoken) {
            try {
                jwt.verify(refreshtoken, process.env.JWT_SECRET_REFRESH_TOKEN);
            } catch (error) {
                if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
                    refreshtoken = await this.TokenUtil.generateRefreshToken(userEncontrado._id);
                } else {
                    throw new CustomError({
                        statusCode: 500,
                        errorType: "ServerError",
                        field: "Token",
                        details: [],
                        customMessage: messages.error.unauthorized('Falha na criação do token')
                    });
                }
            }
        } else {
            refreshtoken = await this.TokenUtil.generateRefreshToken(userEncontrado._id);
        }

        await this.repository.armazenarTokens(userEncontrado._id, accessToken, refreshtoken);

        const userLogado = await this.repository.buscarPorID(userEncontrado._id, false);
        const userObject = userLogado.toObject();

        return {
            user: {
                accessToken,
                refreshtoken,
                ...userObject
            }
        };
    }

    // ═══════════════════════════════════════════
    // LOGIN COM GOOGLE
    // ═══════════════════════════════════════════

    async loginWithGoogle(idToken) {
        // 1. Verificar o idToken com o Google
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (error) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'invalidToken',
                field: 'idToken',
                details: [],
                customMessage: 'Token do Google inválido ou expirado.'
            });
        }

        const { sub: googleId, email, name, picture } = payload;

        // 2. Buscar usuário pelo googleId ou email
        let user = await this.repository.buscarPorGoogleId(googleId);
        let isNewUser = false;

        if (!user) {
            // Tentar buscar por email (conta local existente)
            const userPorEmail = await this.repository.buscarPorEmail(email);

            if (userPorEmail) {
                // Vincular conta Google a conta existente
                user = await this.repository.atualizar(userPorEmail._id, {
                    googleId,
                    authProvider: 'google',
                    foto_perfil: userPorEmail.foto_perfil || picture || ''
                });
            } else {
                // Criar novo usuário Google
                isNewUser = true;
                user = await this.repository.criar({
                    nome: name,
                    email,
                    googleId,
                    authProvider: 'google',
                    foto_perfil: picture || '',
                    profileComplete: false,
                    senha: null
                });
            }
        }

        // Verificar status
        if (user.status === 'inativo') {
            throw new CustomError({
                statusCode: 403,
                errorType: 'forbidden',
                field: 'Status',
                details: [],
                customMessage: 'Conta desativada. Entre em contato com o suporte.'
            });
        }

        // 3. Gerar tokens JWT
        const accessToken = await this.TokenUtil.generateAccessToken(user._id);
        let refreshtoken;

        const userComToken = await this.repository.buscarPorID(user._id, true);
        refreshtoken = userComToken.refreshtoken;

        if (refreshtoken) {
            try {
                jwt.verify(refreshtoken, process.env.JWT_SECRET_REFRESH_TOKEN);
            } catch (error) {
                refreshtoken = await this.TokenUtil.generateRefreshToken(user._id);
            }
        } else {
            refreshtoken = await this.TokenUtil.generateRefreshToken(user._id);
        }

        await this.repository.armazenarTokens(user._id, accessToken, refreshtoken);

        // 4. Calcular profileComplete
        const profileComplete = !!(user.cpf && user.telefone);

        // Atualizar profileComplete no banco se necessário
        if (user.profileComplete !== profileComplete) {
            await this.repository.atualizar(user._id, { profileComplete });
        }

        // 5. Retornar resposta
        const userLogado = await this.repository.buscarPorID(user._id, false);
        const userObject = userLogado.toObject();

        return {
            user: {
                accessToken,
                refreshtoken,
                profileComplete,
                ...userObject
            }
        };
    }

    async logout(id) {
        const data = await this.repository.removerTokens(id);
        return { data };
    }

    async refresh(id, token) {
        const userEncontrado = await this.repository.buscarPorID(id, true);

        if (!userEncontrado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                field: 'Token',
                details: [],
                customMessage: HttpStatusCodes.NOT_FOUND.message
            });
        }

        if (userEncontrado.refreshtoken !== token) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'invalidToken',
                field: 'Token',
                details: [],
                customMessage: messages.error.unauthorized('Token')
            });
        }

        const accesstoken = await this.TokenUtil.generateAccessToken(id);
        let refreshtoken = userEncontrado.refreshtoken;

        await this.repository.armazenarTokens(id, accesstoken, refreshtoken);

        const userLogado = await this.repository.buscarPorID(id, true);
        const userObjeto = userLogado.toObject();

        const userComTokens = {
            accesstoken,
            refreshtoken,
            ...userObjeto
        };

        return { user: userComTokens };
    }

    async recuperaSenha(body) {
        const userEncontrado = await this.repository.buscarPorEmail(body.email);
        if (!userEncontrado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                field: 'Email',
                details: [],
                customMessage: HttpStatusCodes.NOT_FOUND.message
            });
        }

        const tokenUnico = this.TokenUtil.generateRecoveryCode();
        const expMs = Date.now() + 60 * 60 * 1000; // 1 hora

        await this.repository.atualizar(userEncontrado._id, {
            tokenUnico,
            exp_codigo_recupera_senha: new Date(expMs)
        });

        // Enviar email com o token de recuperação
        await EmailService.enviarEmailRecuperacao(
            body.email,
            tokenUnico,
            userEncontrado.nome
        );

        return {
            message: 'Um email com o token de recuperação foi enviado para o seu endereço de email.'
        };
    }

    async atualizarSenhaToken(tokenRecuperacao, novaSenha) {
        const usuario = await this.repository.buscarPorTokenUnico(tokenRecuperacao);
        if (!usuario) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                field: 'Token',
                details: [],
                customMessage: "Token de recuperação já foi utilizado ou é inválido."
            });
        }

        if (usuario.exp_codigo_recupera_senha < new Date()) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                field: 'Token de Recuperação',
                details: [],
                customMessage: 'Token de recuperação expirado.'
            });
        }

        const senhaHasheada = await AuthHelper.hashPassword(novaSenha);
        const usuarioAtualizado = await this.repository.atualizarSenha(usuario._id, senhaHasheada);

        if (!usuarioAtualizado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                field: 'Senha',
                details: [],
                customMessage: 'Erro ao atualizar a senha.'
            });
        }

        return { message: 'Senha atualizada com sucesso.' };
    }
}

export default AuthService;
