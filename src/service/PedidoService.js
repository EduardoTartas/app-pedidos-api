// src/service/PedidoService.js

import {
    CustomError,
    HttpStatusCodes,
    messages,
    ensurePermission
} from '../utils/helpers/index.js';
import PedidoRepository from '../repository/PedidoRepository.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import PratoRepository from '../repository/PratoRepository.js';
// import AdicionalGrupoRepository from '../repository/AdicionalGrupoRepository.js';
// import AdicionalOpcaoRepository from '../repository/AdicionalOpcaoRepository.js';
// import NotificacaoRepository from '../repository/NotificacaoRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';

// Fluxo de status permitido
const FLUXO_STATUS = {
    criado: 'em_preparo',
    em_preparo: 'a_caminho',
    a_caminho: 'entregue'
};

const MENSAGENS_NOTIFICACAO = {
    em_preparo: { tipo: 'em_preparo', titulo: 'Pedido em preparo', mensagem: 'Seu pedido está sendo preparado!' },
    a_caminho: { tipo: 'a_caminho', titulo: 'Pedido a caminho', mensagem: 'Seu pedido saiu para entrega!' },
    entregue: { tipo: 'entregue', titulo: 'Pedido entregue', mensagem: 'Seu pedido foi entregue. Bom apetite!' },
    cancelado: { tipo: 'cancelado', titulo: 'Pedido cancelado', mensagem: 'Seu pedido foi cancelado.' }
};

class PedidoService {
    constructor() {
        this.repository = new PedidoRepository();
        this.restauranteRepository = new RestauranteRepository();
        this.pratoRepository = new PratoRepository();
        // this.grupoRepository = new AdicionalGrupoRepository();
        // this.opcaoRepository = new AdicionalOpcaoRepository();
        // this.notificacaoRepository = new NotificacaoRepository();
        this.usuarioRepository = new UsuarioRepository();
    }

    /**
     * Cria um pedido recalculando os preços no backend.
     */
    async criar(parsedData, req) {
        const clienteId = req.user_id;
        const restauranteId = parsedData.restaurante_id;

        // Verificar se o restaurante existe e está aberto
        const restaurante = await this.restauranteRepository.buscarPorID(restauranteId);
        if (restaurante.status !== 'aberto') {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'Restaurante',
                details: [],
                customMessage: 'O restaurante não está aberto para pedidos no momento.'
            });
        }

        // Recalcular preços no backend para evitar manipulação
        let subtotal = 0;
        const itensCalculados = [];

        for (const item of parsedData.itens) {
            const prato = await this.pratoRepository.buscarPorID(item.prato_id);

            if (String(prato.restaurante_id) !== String(restauranteId)) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Prato',
                    details: [],
                    customMessage: `O prato "${prato.nome}" não pertence a este restaurante.`
                });
            }

            if (prato.status !== 'ativo') {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Prato',
                    details: [],
                    customMessage: `O prato "${prato.nome}" não está disponível.`
                });
            }

            let totalAdicionaisItem = 0;
            const adicionaisCalculados = [];

            if (item.adicionais && item.adicionais.length > 0) {
                // Validar regras de min/max dos grupos de adicionais
                await this.validarAdicionais(prato, item.adicionais);

                for (const adicional of item.adicionais) {
                    const opcao = await this.opcaoRepository.buscarPorID(adicional.opcao_id);

                    adicionaisCalculados.push({
                        opcao_id: opcao._id,
                        opcao_nome: opcao.nome,
                        preco_unitario: opcao.preco,
                        quantidade: adicional.quantidade || 1
                    });

                    totalAdicionaisItem += opcao.preco * (adicional.quantidade || 1);
                }
            }

            const totalItem = (prato.preco + totalAdicionaisItem) * item.quantidade;
            subtotal += totalItem;

            itensCalculados.push({
                prato_id: prato._id,
                prato_nome: prato.nome,
                preco_unitario: prato.preco,
                quantidade: item.quantidade,
                adicionais: adicionaisCalculados
            });
        }

        const taxaEntrega = restaurante.taxa_entrega || 0;
        const total = subtotal + taxaEntrega;

        const pedidoData = {
            cliente_id: clienteId,
            restaurante_id: restauranteId,
            status: 'criado',
            itens: itensCalculados,
            totais: {
                subtotal: Math.round(subtotal * 100) / 100,
                taxa_entrega: Math.round(taxaEntrega * 100) / 100,
                total: Math.round(total * 100) / 100
            },
            historico_status: [{ status: 'criado', data: new Date() }]
        };

        const pedido = await this.repository.criar(pedidoData);

        // Notificar o dono do restaurante
        await this.notificacaoRepository.criar({
            usuario_id: restaurante.dono_id._id || restaurante.dono_id,
            pedido_id: pedido._id,
            tipo: 'pedido_confirmado',
            titulo: 'Novo pedido recebido',
            mensagem: `Novo pedido #${pedido._id} recebido!`
        });

        return pedido;
    }

    /**
     * Valida adicionais respeitando regras min/max dos grupos.
     */
    async validarAdicionais(prato, adicionais) {
        // Agrupar adicionais por grupo
        const adicionaisPorGrupo = {};

        for (const adicional of adicionais) {
            const opcao = await this.opcaoRepository.buscarPorID(adicional.opcao_id);

            const grupoId = String(opcao.grupo_id);
            if (!adicionaisPorGrupo[grupoId]) {
                adicionaisPorGrupo[grupoId] = [];
            }
            adicionaisPorGrupo[grupoId].push(adicional);
        }

        // Validar cada grupo
        for (const [grupoId, adicionaisDoGrupo] of Object.entries(adicionaisPorGrupo)) {
            const grupo = await this.grupoRepository.buscarPorID(grupoId);
            const totalQuantidade = adicionaisDoGrupo.reduce((acc, a) => acc + (a.quantidade || 1), 0);

            if (totalQuantidade < grupo.min) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Adicionais',
                    details: [],
                    customMessage: `O grupo "${grupo.nome}" exige no mínimo ${grupo.min} escolha(s). Foram selecionadas ${totalQuantidade}.`
                });
            }

            if (totalQuantidade > grupo.max) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Adicionais',
                    details: [],
                    customMessage: `O grupo "${grupo.nome}" permite no máximo ${grupo.max} escolha(s). Foram selecionadas ${totalQuantidade}.`
                });
            }
        }

        // Verificar grupos obrigatórios
        if (prato.adicionais_grupo_ids && prato.adicionais_grupo_ids.length > 0) {
            for (const grupoRef of prato.adicionais_grupo_ids) {
                const grupoId = String(grupoRef._id || grupoRef);
                const grupo = await this.grupoRepository.buscarPorID(grupoId);

                if (grupo.obrigatorio && !adicionaisPorGrupo[grupoId]) {
                    throw new CustomError({
                        statusCode: HttpStatusCodes.BAD_REQUEST.code,
                        errorType: 'validationError',
                        field: 'Adicionais',
                        details: [],
                        customMessage: `O grupo "${grupo.nome}" é obrigatório. Selecione pelo menos ${grupo.min} opção(ões).`
                    });
                }
            }
        }
    }

    /**
     * Lista histórico de pedidos do cliente logado.
     */
    async listarMeusPedidos(req) {
        const clienteId = req.user_id;
        const data = await this.repository.listarPorCliente(clienteId, req);
        return data;
    }

    /**
     * Lista pedidos recebidos por um restaurante (painel do dono).
     */
    async listarPedidosRestaurante(restauranteId, req) {
        const restaurante = await this.restauranteRepository.buscarPorID(restauranteId);

        // Verificar se o usuário é o dono do restaurante ou admin
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Pedido',
            customMessage: 'Você não tem permissões para visualizar pedidos deste restaurante.',
        });

        const data = await this.repository.listarPorRestaurante(restauranteId, req);
        return data;
    }

    /**
     * Avança o fluxo do pedido e dispara notificação.
     */
    async atualizarStatus(pedidoId, parsedData, req) {
        const pedido = await this.repository.buscarPorID(pedidoId);

        const novoStatus = parsedData.status;

        // Verificar cancelamento (qualquer momento antes de entregue)
        if (novoStatus === 'cancelado') {
            if (pedido.status === 'entregue') {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Status',
                    details: [],
                    customMessage: 'Não é possível cancelar um pedido já entregue.'
                });
            }
        } else {
            // Verificar se a transição de status é válida
            const statusEsperado = FLUXO_STATUS[pedido.status];
            if (novoStatus !== statusEsperado) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Status',
                    details: [],
                    customMessage: `Transição inválida: "${pedido.status}" → "${novoStatus}". O próximo status esperado é "${statusEsperado || 'nenhum (pedido finalizado)'}".`
                });
            }

            // Verificar se o usuário é o dono do restaurante ou admin
            const restaurante = await this.restauranteRepository.buscarPorID(pedido.restaurante_id._id || pedido.restaurante_id);
            const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
            const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
            ensurePermission({
                usuarioLogado,
                targetId: donoId,
                field: 'Pedido',
                customMessage: 'Você não tem permissões para atualizar o status deste pedido.',
            });
        }

        // Atualizar status e histórico
        const historicoAtualizado = pedido.historico_status || [];
        historicoAtualizado.push({ status: novoStatus, data: new Date() });

        const pedidoAtualizado = await this.repository.atualizar(pedidoId, {
            status: novoStatus,
            historico_status: historicoAtualizado
        });

        // Disparar notificação para o cliente
        const notifData = MENSAGENS_NOTIFICACAO[novoStatus];
        if (notifData) {
            await this.notificacaoRepository.criar({
                usuario_id: pedido.cliente_id._id || pedido.cliente_id,
                pedido_id: pedido._id,
                tipo: notifData.tipo,
                titulo: notifData.titulo,
                mensagem: notifData.mensagem
            });
        }

        return pedidoAtualizado;
    }
}

export default PedidoService;
