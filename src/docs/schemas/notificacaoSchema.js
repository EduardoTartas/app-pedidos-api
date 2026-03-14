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
            lida_em: { type: "string", format: "date-time", nullable: true, example: "16/01/2025 12:00:00" },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
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
            lida_em: { type: "string", format: "date-time", nullable: true, example: "16/01/2025 12:00:00" },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de uma notificação"
    },

    NotificacaoLidaPatch: {
        type: "object",
        properties: {},
        description: "marcar notificação como lida",
        example: {}
    }
};

export default notificacaoSchemas;