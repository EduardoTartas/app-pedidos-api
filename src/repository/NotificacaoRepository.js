import Notificacao from '../models/Notificacao.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class NotificacaoRepository {
    constructor({ NotificacaoModel = Notificacao } = {}) {
        this.modelNotificacao = NotificacaoModel;
    }

    async buscarPorID(id) {
        const notificacao = await this.modelNotificacao.findById(id);
        if (!notificacao) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Notificação',
                details: [],
                customMessage: messages.error.resourceNotFound('Notificação')
            });
        }
        return notificacao;
    }

}

export default NotificacaoRepository;