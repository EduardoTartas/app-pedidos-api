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

    async listarPorUsuario(usuarioId, req) {
        const { lida, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = { usuario_id: usuarioId };
        if (lida !== undefined) filtros.lida = lida === 'true';

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            sort: { createdAt: -1 },
        };

        const resultado = await this.modelNotificacao.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async criar(dadosNotificacao) {
        const notificacao = new this.modelNotificacao(dadosNotificacao);
        return await notificacao.save();
    }

    async marcarComoLida(id) {
        const notificacao = await this.modelNotificacao.findByIdAndUpdate(
            id,
            { lida: true },
            { new: true }
        );
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