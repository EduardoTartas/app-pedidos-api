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

    async criar(dadosNotificacao) {
        return await this.repository.criar(dadosNotificacao);
    }

    /**
     * BUG-07: Checagens de !req.user_id removidas — as rotas de notificação já passam pelo
     * AuthMiddleware que garante req.user_id. Verificação dupla é ruído de código.
     */
    async buscarPorId(id, req) {
        const notificacao = await this.repository.buscarPorID(id);

        if (String(notificacao.usuario_id) !== String(req.user_id)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Notificação',
                details: [],
                customMessage: 'Você não tem permissão para acessar esta notificação.'
            });
        }

        return notificacao;
    }

    async listarMinhasNotificacoes(req) {
        return await this.repository.listar(req);
    }

    async marcarComoLida(id, req) {
        const notificacao = await this.repository.buscarPorID(id);

        // Apenas o destinatário pode marcar a notificação como lida
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

    async deletar(id, req) {
        const notificacao = await this.repository.buscarPorID(id);

        // Apenas o destinatário pode deletar sua notificação
        if (String(notificacao.usuario_id) !== String(req.user_id)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Notificação',
                details: [],
                customMessage: 'Você não tem permissão para deletar esta notificação.'
            });
        }

        return await this.repository.deletar(id);
    }
}

export default NotificacaoService;
