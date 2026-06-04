const notificacaoSchemas = {
    NotificacaoListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78750" },
            usuario_id: { type: "string", example: "674fa21d79969d2172e78710" },
            pedido_id: { type: "string", nullable: true, example: "674fa21d79969d2172e78730" },
            tipo: {
                type: "string",
                enum: ["pedido_confirmado", "em_preparo", "a_caminho", "entregue", "cancelado", "avaliacao", "geral"],
                example: "pedido_confirmado"
            },
            titulo: { type: "string", example: "Pedido Confirmado!" },
            mensagem: { type: "string", example: "Seu pedido #674fa2 foi confirmado pelo restaurante." },
            lida_em: { type: "string", format: "date-time", nullable: true, example: "2025-01-16T12:00:00.000Z" },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para listagem de notificações"
    },

    NotificacaoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78750" },
            usuario_id: { type: "string", example: "674fa21d79969d2172e78710" },
            pedido_id: { type: "string", nullable: true, example: "674fa21d79969d2172e78730" },
            tipo: {
                type: "string",
                enum: ["pedido_confirmado", "em_preparo", "a_caminho", "entregue", "cancelado", "avaliacao", "geral"],
                example: "pedido_confirmado"
            },
            titulo: { type: "string", example: "Pedido Confirmado!" },
            mensagem: { type: "string", example: "Seu pedido #674fa2 foi confirmado pelo restaurante." },
            lida_em: { type: "string", format: "date-time", nullable: true, example: "2025-01-16T12:00:00.000Z" },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para detalhes de uma notificação"
    },

    NotificacaoLidaPatch: {
        type: "object",
        properties: {},
        description: "marcar notificação como lida",
        example: {}
    },

    NotificacaoPost: {
        type: "object",
        properties: {
            usuario_id: { type: "string", description: "ID do usuário destinarário", example: "674fa21d79969d2172e78710" },
            pedido_id: { type: "string", description: "ID do pedido (opcional)", example: "674fa21d79969d2172e78730" },
            tipo: {
                type: "string",
                enum: ["pedido_confirmado", "em_preparo", "a_caminho", "entregue", "cancelado", "avaliacao", "geral"],
                example: "geral"
            },
            titulo: { type: "string", example: "Atualização no sistema" },
            mensagem: { type: "string", example: "Os termos de uso foram atualizados." }
        },
        required: ["usuario_id", "tipo", "titulo", "mensagem"],
        description: "Schema para criação manual de notificação"
    }
};

export default notificacaoSchemas;