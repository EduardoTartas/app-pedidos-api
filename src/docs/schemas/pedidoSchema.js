// src/docs/schemas/pedidoSchema.js

const pedidoSchemas = {
    PedidoFiltro: {
        type: "object",
        properties: {
            status: {
                type: "string",
                enum: ["criado", "em_preparo", "a_caminho", "entregue", "cancelado"],
                description: "Filtra por status",
                example: "criado"
            }
        }
    },

    PedidoListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78730" },
            cliente_id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            status: { type: "string", enum: ["criado", "em_preparo", "a_caminho", "entregue", "cancelado"], example: "criado" },
            itens: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        prato_id: { type: "string", example: "674fa21d79969d2172e78712" },
                        prato_nome: { type: "string", example: "X-Burguer Especial" },
                        preco_unitario: { type: "number", example: 29.90 },
                        quantidade: { type: "number", example: 2 },
                        adicionais: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    opcao_id: { type: "string", example: "674fa21d79969d2172e78720" },
                                    opcao_nome: { type: "string", example: "Cheddar Extra" },
                                    preco_unitario: { type: "number", example: 3.50 },
                                    quantidade: { type: "number", example: 1 }
                                }
                            }
                        }
                    }
                }
            },
            totais: {
                type: "object",
                properties: {
                    subtotal: { type: "number", example: 63.30 },
                    taxa_entrega: { type: "number", example: 5.99 },
                    total: { type: "number", example: 69.29 }
                }
            },
            avaliacao_id: { type: "string", nullable: true, example: null },
            historico_status: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "criado" },
                        data: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
                    }
                }
            },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de pedidos"
    },

    PedidoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78730" },
            cliente_id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            status: { type: "string", enum: ["criado", "em_preparo", "a_caminho", "entregue", "cancelado"], example: "criado" },
            itens: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        prato_id: { type: "string", example: "674fa21d79969d2172e78712" },
                        prato_nome: { type: "string", example: "X-Burguer Especial" },
                        preco_unitario: { type: "number", example: 29.90 },
                        quantidade: { type: "number", example: 2 },
                        adicionais: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    opcao_id: { type: "string", example: "674fa21d79969d2172e78720" },
                                    opcao_nome: { type: "string", example: "Cheddar Extra" },
                                    preco_unitario: { type: "number", example: 3.50 },
                                    quantidade: { type: "number", example: 1 }
                                }
                            }
                        }
                    }
                }
            },
            totais: {
                type: "object",
                properties: {
                    subtotal: { type: "number", example: 63.30 },
                    taxa_entrega: { type: "number", example: 5.99 },
                    total: { type: "number", example: 69.29 }
                }
            },
            avaliacao_id: { type: "string", nullable: true, example: null },
            historico_status: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "criado" },
                        data: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
                    }
                }
            },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de um pedido"
    },

    PedidoPost: {
        type: "object",
        properties: {
            restaurante_id: { type: "string", description: "ID do restaurante", example: "674fa21d79969d2172e78711" },
            itens: {
                type: "array",
                description: "Lista de itens do pedido",
                items: {
                    type: "object",
                    properties: {
                        prato_id: { type: "string", description: "ID do prato", example: "674fa21d79969d2172e78712" },
                        quantidade: { type: "number", description: "Quantidade", example: 2 },
                        adicionais: {
                            type: "array",
                            description: "Lista de adicionais do item",
                            items: {
                                type: "object",
                                properties: {
                                    opcao_id: { type: "string", description: "ID da opção de adicional", example: "674fa21d79969d2172e78720" },
                                    quantidade: { type: "number", description: "Quantidade do adicional", example: 1 }
                                },
                                required: ["opcao_id"]
                            }
                        }
                    },
                    required: ["prato_id", "quantidade"]
                }
            }
        },
        required: ["restaurante_id", "itens"],
        description: "Schema para criação de um pedido",
        example: {
            restaurante_id: "674fa21d79969d2172e78711",
            itens: [
                {
                    prato_id: "674fa21d79969d2172e78712",
                    quantidade: 2,
                    adicionais: [
                        { opcao_id: "674fa21d79969d2172e78720", quantidade: 1 }
                    ]
                }
            ]
        }
    },

    PedidoStatusUpdate: {
        type: "object",
        properties: {
            status: {
                type: "string",
                enum: ["em_preparo", "a_caminho", "entregue", "cancelado"],
                description: "Novo status do pedido",
                example: "em_preparo"
            }
        },
        required: ["status"],
        description: "Schema para atualização de status de um pedido",
        example: {
            status: "em_preparo"
        }
    }
};

export default pedidoSchemas;
