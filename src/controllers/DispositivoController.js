// src/controllers/DispositivoController.js
import npaas from '../utils/npaas.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';
import logger from '../utils/logger.js';

class DispositivoController {
    static async registrar(req, res, next) {
        try {
            const { tokenFcm, plataforma = 'android', versaoApp, alvo } = req.body;
            const usuarioId = req.user_id;

            const appAlvo = alvo || (['android', 'ios'].includes(plataforma.toLowerCase()) ? 'mobile' : 'web');
            const npaasUsuarioId = `${usuarioId}_${appAlvo}`;

            if (!tokenFcm) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    field: 'tokenFcm',
                    customMessage: 'Token FCM é obrigatório.'
                });
            }

            await npaas.post('/api/v1/dispositivos', {
                tokenFcm,
                plataforma,
                versaoApp: versaoApp ?? 'desconhecida',
                usuarioId: npaasUsuarioId
            });

            logger.info(`[NPaaS] Dispositivo registrado para o usuário ${npaasUsuarioId}`);

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Dispositivo registrado com sucesso'
            });
        } catch (error) {
            logger.error(`[DispositivoController] Erro ao registrar: ${error.message}`);
            next(error);
        }
    }

    static async desativar(req, res, next) {
        try {
            const { tokenFcm } = req.body;

            if (!tokenFcm) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    field: 'tokenFcm',
                    customMessage: 'Token FCM é obrigatório.'
                });
            }

            await npaas.post('/api/v1/dispositivos/desativar-token', { tokenFcm });
            logger.info(`[NPaaS] Token FCM desativado`);

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Dispositivo desativado com sucesso'
            });
        } catch (error) {
            logger.error(`[DispositivoController] Erro ao desativar token: ${error.message}`);
            next(error);
        }
    }
}

export default DispositivoController;
