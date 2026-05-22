// src/service/EmailService.js

import transporter from '../config/emailConfig.js';
import emailRecuperacaoSenha from '../utils/templates/emailRecuperacaoSenha.js';
import emailVerificacao from '../utils/templates/emailVerificacao.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

class EmailService {
    async enviarEmailRecuperacao(email, token, nomeUsuario) {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo-rango.png');
        const attachments = [];

        if (fs.existsSync(logoPath)) {
            attachments.push({
                filename: 'logo-rango.png',
                path: logoPath,
                cid: 'logoRango'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de Senha - RanGo',
            html: emailRecuperacaoSenha(token, nomeUsuario),
            attachments
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            logger.info(`Email de recuperação enviado para ${email}. MessageId: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Falha ao enviar email de recuperação para ${email}: ${error.message}`);
            throw error;
        }
    }

    async enviarEmailVerificacao(email, token, nomeUsuario) {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo-rango.png');
        const attachments = [];

        if (fs.existsSync(logoPath)) {
            attachments.push({
                filename: 'logo-rango.png',
                path: logoPath,
                cid: 'logoRango'
            });
        }

        const linkVerificacao = `${process.env.API_BASE_URL || 'http://localhost:5020'}/verificar-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'Verificação de Email - RanGo',
            html: emailVerificacao(linkVerificacao, nomeUsuario),
            attachments
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            logger.info(`Email de verificação enviado para ${email}. MessageId: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Falha ao enviar email de verificação para ${email}: ${error.message}`);
            throw error;
        }
    }
}

export default new EmailService();
