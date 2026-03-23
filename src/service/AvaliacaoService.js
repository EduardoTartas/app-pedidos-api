import {
    CustomError,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import AvaliacaoRepository from '../repository/AvaliacaoRepository.js';
import PedidoRepository from '../repository/PedidoRepository.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import NotificacaoRepository from '../repository/NotificacaoRepository.js';

class AvaliacaoService {
    constructor() {
        this.repository = new AvaliacaoRepository();
        this.pedidoRepository = new PedidoRepository();
        this.restauranteRepository = new RestauranteRepository();
        this.notificacaoRepository = new NotificacaoRepository();
    }

    async criar(parsedData, req) {
        const clienteId = req.user_id;
        const pedidoId = parsedData.pedido_id;

        // Verificar se o pedido existe e está entregue
        const pedido = await this.pedidoRepository.buscarPorID(pedidoId);

        if (String(pedido.cliente_id._id || pedido.cliente_id) !== String(clienteId)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'permissionError',
                field: 'Avaliação',
                details: [],
                customMessage: "Você não pode avaliar um pedido que não é seu."
            });
        }

        if (pedido.status !== 'entregue') {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'Avaliação',
                details: [],
                customMessage: 'Só é possível avaliar pedidos que já foram entregues.'
            });
        }

        // Verificar se já existe avaliação para este pedido
        const avaliacaoExistente = await this.repository.buscarPorPedidoId(pedidoId);
        if (avaliacaoExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'duplicateError',
                field: 'Avaliação',
                details: [],
                customMessage: 'Este pedido já foi avaliado.'
            });
        }

    const restauranteId = pedido.restaurante_id._id || pedido.restaurante_id;

        const avaliacao = await this.repository.criar({
            pedido_id: pedidoId,
            cliente_id: clienteId,
            restaurante_id: restauranteId,
            nota: parsedData.nota,
            descricao: parsedData.descricao || ''
        });

        // Vincular avaliação ao pedido
        await this.pedidoRepository.atualizar(pedidoId, { avaliacao_id: avaliacao._id });

        // Recalcular média do restaurante
        const novaMedia = await this.repository.calcularMediaRestaurante(restauranteId);
        await this.restauranteRepository.atualizar(restauranteId, {
            avaliacao_media: Math.round(novaMedia * 10) / 10
        });

        // Notificar o dono do restaurante
        const restaurante = await this.restauranteRepository.buscarPorID(restauranteId);
        await this.notificacaoRepository.criar({
            usuario_id: restaurante.dono_id._id || restaurante.dono_id,
            pedido_id: pedidoId,
            tipo: 'avaliacao',
            titulo: 'Nova avaliação recebida',
            mensagem: `Você recebeu uma avaliação de ${parsedData.nota} estrela(s).`
        });

        return avaliacao;
    }

    /*Lista avaliações de um restaurante com paginação.*/
    async listarPorRestaurante(restauranteId, req) {
        await this.restauranteRepository.buscarPorID(restauranteId);
        const data = await this.repository.listarPorRestaurante(restauranteId, req);
        return data;
   }
}
export default AvaliacaoService;
