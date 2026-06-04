const avaliacaoSchemas = {
    AvaliacaoListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78740" },
            pedido_id: { type: "string", example: "674fa21d79969d2172e78730" },
            cliente_id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            nota: { type: "number", minimum: 1, maximum: 5, example: 5 },
            descricao: { type: "string", example: "Excelente! Comida deliciosa e entrega rápida." },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para listagem de avaliações"
    },

    AvaliacaoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78740" },
            pedido_id: { type: "string", example: "674fa21d79969d2172e78730" },
            cliente_id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            nota: { type: "number", minimum: 1, maximum: 5, example: 5 },
            descricao: { type: "string", example: "Excelente! Comida deliciosa e entrega rápida." },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para detalhes de uma avaliação"
    },

    AvaliacaoPost: {
        type: "object",
        properties: {
            pedido_id: {
                type: "string",
                description: "ID do pedido a ser avaliado (deve estar com status 'entregue')",
                example: "674fa21d79969d2172e78730"
            },
            nota: {
                type: "number",
                minimum: 1,
                maximum: 5,
                description: "Nota de 1 a 5 estrelas",
                example: 5
            },
            descricao: {
                type: "string",
                description: "Comentário descritivo da avaliação",
                example: "Excelente! Comida deliciosa e entrega rápida."
            }
        },
        required: ["pedido_id", "nota"],
        description: "Schema para criação de uma avaliação",
        example: {
            pedido_id: "674fa21d79969d2172e78730",
            nota: 5,
            descricao: "Excelente! Comida deliciosa e entrega rápida."
        }
    }
};

export default avaliacaoSchemas;
