import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import NotificacaoRepository from '../repository/NotificacaoRepository.js';

class NotificacaoService {
    constructor() {
        this.repository = new NotificacaoRepository();
    }

    async listarMinhasNotificacoes(req) {
        if (!req.user_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'unauthorized',
                field: 'Autenticação',
                details: [],
                customMessage: 'Usuário não autenticado. Faça login para acessar as notificações.'
            });
        }

        return await this.repository.listar(req);
    }

    async marcarComoLida(id, req) {
        if (!req.user_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'unauthorized',
                field: 'Autenticação',
                details: [],
                customMessage: 'Usuário não autenticado. Faça login para gerenciar notificações.'
            });
        }

    const notificacao = await this.repository.buscarPorID(id);

        // o destinatário  marcar a notificação como lida
        if (String(notificacao.usuario_id) !== String(req.user_id)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Notificação',
                details: [],
                customMessage: 'Você não tem permissão para marcar esta notificação como lida.'
            });
        }

        const updated = await this.repository.marcarComoLida(id);
        return updated;
    }
}

export default NotificacaoService;
