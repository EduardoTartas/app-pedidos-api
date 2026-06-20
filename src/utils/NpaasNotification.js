// src/utils/NpaasNotification.js
import npaas from './npaas.js';
import logger from './logger.js';

class NpaasNotification {
    /**
     * Envia notificação para um usuário específico via NPaaS
     */
    async notificarUsuario(usuarioId, { titulo, corpo, dados, slugModelo, variaveis, alvo = 'mobile' }) {
        try {
            const npaasUsuarioId = `${usuarioId}_${alvo}`;
            const payload = {
                usuarioId: npaasUsuarioId,
                titulo,
                corpo,
                dados,
                slugModelo,
                variaveis
            };
            const { data } = await npaas.post('/api/v1/notificacoes/enviar', payload);
            logger.info(`[NPaaS] Notificação enviada para usuário ${usuarioId}`);
            return data.dados?._id ?? null;
        } catch (error) {
            logger.error(`[NPaaS] Erro ao notificar usuário ${usuarioId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Desativa token FCM recebido no logout
     */
    async desativarToken(tokenFcm) {
        try {
            await npaas.post('/api/v1/dispositivos/desativar-token', { tokenFcm });
            logger.info(`[NPaaS] Token FCM desativado`);
        } catch (error) {
            logger.error(`[NPaaS] Erro ao desativar token: ${error.message}`);
        }
    }
}

export default new NpaasNotification();
