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
        const { lida, tipo, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filtros = { usuario_id: usuarioId };
        
        // Filtrar por notificações lidas (lida_em !== null) ou não lidas (lida_em === null)
        if (lida !== undefined) {
            if (lida === 'true') {
                filtros.lida_em = { $ne: null };
            } else if (lida === 'false') {
                filtros.lida_em = null;
            }
        }

        // Filtrar por tipo
        if (tipo !== undefined && tipo !== '') {
            filtros.tipo = tipo;
        }

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

    async listar(req) {
        if (!req.user_id) {
            throw new Error('Usuário não autenticado');
        }
        return await this.listarPorUsuario(req.user_id, req);
    }

    async criar(dadosNotificacao) {
        const notificacao = new this.modelNotificacao(dadosNotificacao);
        return await notificacao.save();
    }

    async marcarComoLida(id) {
        // Busca a notificação primeiro para verificar se já foi lida
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

        // Se já foi lida, retorna a notificação
        if (notificacao.lida_em !== null) {
            return notificacao;
        }

        // Marca como lida
        const notificacaoAtualizada = await this.modelNotificacao.findByIdAndUpdate(
            id,
            { lida_em: new Date() },
            { new: true }
        );
        
        return notificacaoAtualizada;
    }

    async deletar(id) {
        const notificacao = await this.modelNotificacao.findByIdAndDelete(id);
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

    async deletarPorUsuario(usuarioId) {
        return await this.modelNotificacao.deleteMany({ usuario_id: usuarioId });
    }
}

export default NotificacaoRepository;