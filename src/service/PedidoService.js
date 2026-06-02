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
import AdicionalGrupoRepository from '../repository/AdicionalGrupoRepository.js';
import AdicionalOpcaoRepository from '../repository/AdicionalOpcaoRepository.js';
import NotificacaoRepository from '../repository/NotificacaoRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import EnderecoRepository from '../repository/EnderecoRepository.js';

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
        this.grupoRepository = new AdicionalGrupoRepository();
        this.opcaoRepository = new AdicionalOpcaoRepository();
        this.notificacaoRepository = new NotificacaoRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.enderecoRepository = new EnderecoRepository();
    }

    /**
     * Cria um pedido recalculando os preços no backend.
     * MELHORIA-05: Inclui endereço de entrega como snapshot e forma de pagamento.
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

        // MELHORIA-03: Verificar horário de funcionamento se configurado
        if (restaurante.horario_funcionamento && restaurante.horario_funcionamento.length > 0) {
            const dentroDHorario = this.isRestauranteAbertoPorHorario(restaurante.horario_funcionamento);
            if (!dentroDHorario) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Restaurante',
                    details: [],
                    customMessage: 'O restaurante está fora do horário de funcionamento.'
                });
            }
        }

        // Validar que há itens e que as quantidades são válidas
        if (!parsedData.itens || parsedData.itens.length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'Itens',
                details: [],
                customMessage: 'O pedido deve ter pelo menos um item.'
            });
        }

        for (const item of parsedData.itens) {
            if (!item.quantidade || item.quantidade < 1) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Itens',
                    details: [],
                    customMessage: `A quantidade de cada item deve ser pelo menos 1.`
                });
            }
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
            const adicionaisInput = item.adicionais || [];

            // BUG-03: Validação de adicionais com batch queries (sem N+1)
            const adicionaisComPrecos = await this.validarAdicionais(prato, adicionaisInput);

            for (const { opcao, quantidade } of adicionaisComPrecos) {
                adicionaisCalculados.push({
                    opcao_id: opcao._id,
                    opcao_nome: opcao.nome,
                    preco_unitario: opcao.preco,
                    quantidade
                });
                totalAdicionaisItem += opcao.preco * quantidade;
            }

            const totalItem = (prato.preco + totalAdicionaisItem) * item.quantidade;
            subtotal += totalItem;

            itensCalculados.push({
                prato_id: prato._id,
                prato_nome: prato.nome,
                preco_unitario: prato.preco,
                quantidade: item.quantidade,
                observacao: item.observacao || "",
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
            // MELHORIA-05: Snapshot do endereço — preservado mesmo se o usuário alterar depois
            endereco_entrega: parsedData.endereco_entrega,
            forma_pagamento: parsedData.forma_pagamento || 'pix',
            historico_status: [{ status: 'criado', data: new Date() }]
        };

        const pedido = await this.repository.criar(pedidoData);

        // Notificar o dono do restaurante
        if (restaurante.dono_id) {
            await this.notificacaoRepository.criar({
                usuario_id: restaurante.dono_id?._id || restaurante.dono_id,
                pedido_id: pedido._id,
                tipo: 'pedido_confirmado',
                titulo: 'Novo pedido recebido',
                mensagem: `Novo pedido #${pedido._id} recebido!`
            });
        }

        return pedido;
    }

    /**
     * Valida adicionais respeitando regras min/max dos grupos.
     * BUG-03: Usa batch queries para buscar todas as opções e grupos de uma vez,
     * eliminando o problema de N+1 queries que causava alta latência.
     *
     * @returns {Array} Lista de { opcao, quantidade } para cálculo de preços
     */
    async validarAdicionais(prato, adicionais) {
        if (!adicionais || adicionais.length === 0) {
            // Verificar grupos obrigatórios mesmo sem adicionais selecionados
            await this.validarGruposObrigatorios(prato, {});
            return [];
        }

        // ── BATCH 1: Buscar todas as opções de uma vez ──
        const opcaoIds = adicionais.map(a => a.opcao_id);
        const opcoes = await this.opcaoRepository.buscarPorIDs(opcaoIds);
        const opcoesMap = new Map(opcoes.map(o => [String(o._id), o]));

        // IDs dos grupos vinculados ao prato
        const gruposVinculadosIds = (prato.adicionais_grupo_ids || []).map(g => String(g._id || g));

        // Agrupar adicionais por grupo e validar pertencimento
        const adicionaisPorGrupo = {};
        const resultados = [];

        for (const adicional of adicionais) {
            const opcao = opcoesMap.get(String(adicional.opcao_id));
            if (!opcao) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.NOT_FOUND.code,
                    errorType: 'resourceNotFound',
                    field: 'Adicionais',
                    details: [],
                    customMessage: `Opção de adicional com ID "${adicional.opcao_id}" não encontrada.`
                });
            }

            const grupoId = String(opcao.grupo_id);

            // Verificar se o grupo do adicional pertence ao prato
            if (!gruposVinculadosIds.includes(grupoId)) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Adicionais',
                    details: [],
                    customMessage: `O adicional "${opcao.nome}" não pertence a este prato.`
                });
            }

            const quantidade = adicional.quantidade || 1;
            if (!adicionaisPorGrupo[grupoId]) {
                adicionaisPorGrupo[grupoId] = 0;
            }
            adicionaisPorGrupo[grupoId] += quantidade;

            resultados.push({ opcao, quantidade });
        }

        // ── BATCH 2: Buscar todos os grupos necessários de uma vez ──
        const grupoIdsNecessarios = [
            ...new Set([
                ...Object.keys(adicionaisPorGrupo),
                ...gruposVinculadosIds
            ])
        ];
        const grupos = await this.grupoRepository.listarPorIds(grupoIdsNecessarios);
        const gruposMap = new Map(grupos.map(g => [String(g._id), g]));

        // Validar regras min/max por grupo
        for (const [grupoId, totalQuantidade] of Object.entries(adicionaisPorGrupo)) {
            const grupo = gruposMap.get(grupoId);
            if (!grupo) continue;

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

        // Verificar grupos obrigatórios (usando o mapa já carregado)
        await this.validarGruposObrigatorios(prato, adicionaisPorGrupo, gruposMap);

        return resultados;
    }

    /**
     * Verifica se todos os grupos obrigatórios foram atendidos.
     * Reutiliza o gruposMap já carregado para evitar queries extras.
     */
    async validarGruposObrigatorios(prato, adicionaisPorGrupo, gruposMap = null) {
        if (!prato.adicionais_grupo_ids || prato.adicionais_grupo_ids.length === 0) return;

        // Se não temos o mapa, carregamos apenas os grupos do prato
        if (!gruposMap) {
            const grupoIds = prato.adicionais_grupo_ids.map(g => String(g._id || g));
            const grupos = await this.grupoRepository.listarPorIds(grupoIds);
            gruposMap = new Map(grupos.map(g => [String(g._id), g]));
        }

        for (const grupoRef of prato.adicionais_grupo_ids) {
            if (!grupoRef) continue;
            const grupoId = String(grupoRef._id || grupoRef);
            const grupo = gruposMap.get(grupoId);
            if (!grupo) continue;

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

    /**
     * MELHORIA-03: Verifica se o restaurante está dentro do horário de funcionamento.
     * Usa timezone de Brasília (America/Sao_Paulo).
     *
     * @param {Array} horarios - Array de { dia, abertura, fechamento, fechado }
     * @returns {boolean} true se está dentro do horário
     */
    isRestauranteAbertoPorHorario(horarios) {
        const agora = new Date();
        const opcoes = { timeZone: 'America/Sao_Paulo', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false };

        const diaSemanaMap = {
            'domingo': 'domingo',
            'monday': 'segunda', 'segunda-feira': 'segunda',
            'tuesday': 'terca', 'terça-feira': 'terca',
            'wednesday': 'quarta', 'quarta-feira': 'quarta',
            'thursday': 'quinta', 'quinta-feira': 'quinta',
            'friday': 'sexta', 'sexta-feira': 'sexta',
            'saturday': 'sabado', 'sábado': 'sabado',
        };

        const partes = new Intl.DateTimeFormat('pt-BR', opcoes).formatToParts(agora);
        const diaFull = partes.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
        const diaAtual = diaSemanaMap[diaFull] || diaFull;
        const horaAtual = partes.find(p => p.type === 'hour')?.value || '00';
        const minAtual = partes.find(p => p.type === 'minute')?.value || '00';
        const horaMinAtual = `${horaAtual}:${minAtual}`;

        const horarioDoDia = horarios.find(h => h.dia === diaAtual);

        // Se não há configuração para hoje ou está marcado como fechado
        if (!horarioDoDia || horarioDoDia.fechado) return false;

        const abertura = horarioDoDia.abertura || '00:00';
        const fechamento = horarioDoDia.fechamento || '23:59';

        // Comparação simples de strings HH:mm (funciona para horários no mesmo dia)
        return horaMinAtual >= abertura && horaMinAtual <= fechamento;
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
        const donoId = String(restaurante.dono_id?._id || restaurante.dono_id);
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
     * Busca detalhes de um pedido específico.
     */
    async buscarPorID(id, req) {
        const pedido = await this.repository.buscarPorID(id);

        // Verificar permissão (apenas cliente, dono ou admin)
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const restaurante = await this.restauranteRepository.buscarPorID(pedido.restaurante_id?._id || pedido.restaurante_id);
        
        const donoId = String(restaurante.dono_id?._id || restaurante.dono_id);
        const clienteId = String(pedido.cliente_id?._id || pedido.cliente_id);

        const isDonoOuAdmin = usuarioLogado.isAdmin || String(usuarioLogado._id) === donoId;
        const isCliente = String(usuarioLogado._id) === clienteId;

        if (!isDonoOuAdmin && !isCliente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'forbidden',
                field: 'Pedido',
                details: [],
                customMessage: 'Você não tem permissão para visualizar este pedido.'
            });
        }

        return pedido;
    }

    /**
     * Avança o fluxo do pedido e dispara notificação.
     */
    async atualizarStatus(pedidoId, parsedData, req) {
        const pedido = await this.repository.buscarPorID(pedidoId);

        const novoStatus = parsedData.status;

        // Verificar cancelamento com janela de tempo
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

            // Verificar se o usuário é o cliente, o dono do restaurante ou admin
            const restaurante = await this.restauranteRepository.buscarPorID(pedido.restaurante_id?._id || pedido.restaurante_id);
            const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
            const donoId = String(restaurante.dono_id?._id || restaurante.dono_id);
            const clienteId = String(pedido.cliente_id?._id || pedido.cliente_id);

            const isDonoOuAdmin = usuarioLogado.isAdmin || String(usuarioLogado._id) === donoId;
            const isCliente = String(usuarioLogado._id) === clienteId;

            if (!isDonoOuAdmin && !isCliente) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.FORBIDDEN.code,
                    errorType: 'forbidden',
                    field: 'Pedido',
                    details: [],
                    customMessage: 'Você não tem permissão para cancelar este pedido.'
                });
            }

            // Cliente só pode cancelar em 'criado'
            if (isCliente && !isDonoOuAdmin && pedido.status !== 'criado') {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Status',
                    details: [],
                    customMessage: 'Você só pode cancelar o pedido enquanto ele estiver no status "criado". Entre em contato com o restaurante para solicitar o cancelamento.'
                });
            }

            // Dono/admin pode cancelar em 'criado' ou 'em_preparo'
            if (isDonoOuAdmin && !['criado', 'em_preparo'].includes(pedido.status)) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'Status',
                    details: [],
                    customMessage: `Não é possível cancelar um pedido no status "${pedido.status}".`
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
                    customMessage: `Transição inválida: "${pedido.status}" → "${novoStatus}". O próximo status esperado é "${statusEsperado || 'nenhum (pedido finalizado)'}'.`
                });
            }

            // Para outros status (em_preparo, etc), apenas dono ou admin, com exceção de cliente marcando como entregue
            const restaurante = await this.restauranteRepository.buscarPorID(pedido.restaurante_id?._id || pedido.restaurante_id);
            const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
            const donoId = String(restaurante.dono_id?._id || restaurante.dono_id);
            const clienteId = String(pedido.cliente_id?._id || pedido.cliente_id);

            const isClienteAtualizandoEntrega = (novoStatus === 'entregue' && pedido.status === 'a_caminho' && String(usuarioLogado._id) === clienteId);

            if (!isClienteAtualizandoEntrega) {
                ensurePermission({
                    usuarioLogado,
                    targetId: donoId,
                    field: 'Pedido',
                    customMessage: 'Você não tem permissões para atualizar o status deste pedido.',
                });
            }
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
                usuario_id: pedido.cliente_id?._id || pedido.cliente_id,
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
