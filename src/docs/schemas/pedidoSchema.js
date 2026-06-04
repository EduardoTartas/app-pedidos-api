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
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
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
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para detalhes de um pedido"
    },

    PedidoPost: {
        type: "object",
        properties: {
            restaurante_id: { type: "string", description: "Cole o ID do restaurante", example: "ID_DO_RESTAURANTE" },
            itens: {
                type: "array",
                description: "Lista de pratos que você deseja pedir",
                items: {
                    type: "object",
                    properties: {
                        prato_id: { type: "string", description: "Cole o ID do prato", example: "ID_DO_PRATO" },
                        quantidade: { type: "number", description: "Quantidade do prato", example: 1 },
                        adicionais: {
                            type: "array",
                            description: "Opcional: Se quiser adicionar um opcional, coloque o ID. Se não, basta apagar este bloco.",
                            items: {
                                type: "object",
                                properties: {
                                    opcao_id: { type: "string", description: "Cole o ID do adicional (opção) aqui", example: "ID_DA_OPCAO" },
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
        description: "Schema para criar um pedido. Preencha os IDs abaixo. Apague o bloco de 'adicionais' se não quiser nenhum opcional.",
        example: {
            restaurante_id: "COLE_O_ID_DO_RESTAURANTE_AQUI",
            itens: [
                {
                    prato_id: "COLE_O_ID_DO_PRATO_AQUI",
                    quantidade: 1,
                    adicionais: [
                        { 
                            opcao_id: "SE_QUISER_OPCIONAL_COLE_O_ID_AQUI_SENAO_APAGUE_ESTE_BLOCO", 
                            quantidade: 1 
                        }
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
