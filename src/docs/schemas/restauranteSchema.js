// src/docs/schemas/restauranteSchema.js

const restauranteSchemas = {
    RestauranteFiltro: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Filtra por nome" },
            status: { type: "string", enum: ["aberto", "fechado", "inativo"], description: "Filtra por status" },
            categoria: { type: "string", description: "Filtra por categoria - Deve ser o ID da categoria (ObjectId) ou uma lista de IDs separados por vírgula" }
        }
    },

    RestauranteListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Burger House" },
            foto_restaurante: { type: "string", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            dono_id: { type: "string", example: "674fa21d79969d2172e78711" },
            cnpj: { type: "string", example: "23321946000100" },
            status: { type: "string", enum: ["aberto", "fechado"], example: "aberto" },
            ativo: { type: "boolean", example: true, description: "Indica se o restaurante está visível globalmente" },
            deletado: { type: "boolean", example: false, description: "Flag de Soft Delete" },
            categoria_ids: {
                type: "array",
                items: { type: "string" },
                example: ["674fa21d79969d2172e78712"]
            },
            secoes_cardapio: {
                type: "array",
                items: { type: "string" },
                example: ["Hambúrgueres", "Bebidas", "Sobremesas"]
            },
            estimativa_entrega_min: { type: "number", example: 30 },
            estimativa_entrega_max: { type: "number", example: 50 },
            avaliacao_media: { type: "number", example: 4.5 },
            taxa_entrega: { type: "number", example: 5.99 },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para listagem de restaurantes"
    },

    RestauranteDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Burger House" },
            foto_restaurante: { type: "string", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            dono_id: { type: "string", example: "674fa21d79969d2172e78711" },
            cnpj: { type: "string", example: "23321946000100" },
            status: { type: "string", enum: ["aberto", "fechado"], example: "aberto" },
            ativo: { type: "boolean", example: true },
            deletado: { type: "boolean", example: false },
            categoria_ids: {
                type: "array",
                items: { type: "string" },
                example: ["674fa21d79969d2172e78712"]
            },
            secoes_cardapio: {
                type: "array",
                items: { type: "string" },
                example: ["Hambúrgueres", "Bebidas", "Sobremesas"]
            },
            horario_funcionamento: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        dia: { type: "string", enum: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] },
                        abertura: { type: "string", example: "08:00" },
                        fechamento: { type: "string", example: "22:00" },
                        fechado: { type: "boolean", example: false }
                    }
                }
            },
            estimativa_entrega_min: { type: "number", example: 30 },
            estimativa_entrega_max: { type: "number", example: 50 },
            avaliacao_media: { type: "number", example: 4.5 },
            taxa_entrega: { type: "number", example: 5.99 },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para detalhes de um restaurante"
    },

    RestaurantePost: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome do restaurante", example: "Burger House" },
            foto_restaurante: { type: "string", description: "URL da foto do restaurante", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            cnpj: { type: "string", description: "CNPJ do restaurante (14 dígitos)", example: "23321946000100" },
            categoria_ids: {
                type: "array",
                items: { type: "string" },
                description: "IDs das categorias do restaurante",
                example: ["674fa21d79969d2172e78712"]
            },
            secoes_cardapio: {
                type: "array",
                items: { type: "string" },
                description: "Seções do cardápio",
                example: ["Hambúrgueres", "Bebidas", "Sobremesas"]
            },
            horario_funcionamento: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        dia: { type: "string", enum: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] },
                        abertura: { type: "string", example: "08:00" },
                        fechamento: { type: "string", example: "22:00" },
                        fechado: { type: "boolean", example: false }
                    }
                }
            },
            estimativa_entrega_min: { type: "number", description: "Tempo mínimo de entrega (min)", example: 30 },
            estimativa_entrega_max: { type: "number", description: "Tempo máximo de entrega (min)", example: 50 },
            taxa_entrega: { type: "number", description: "Taxa de entrega em reais", example: 5.99 }
        },
        required: ["nome"],
        description: "Schema para criação de um restaurante"
    },

    RestaurantePatch: {
        type: "object",
        properties: {
            nome: { type: "string", example: "Burger House Premium" },
            foto_restaurante: { type: "string", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            status: { type: "string", enum: ["aberto", "fechado"], example: "aberto" },
            ativo: { type: "boolean", example: true },
            cnpj: { type: "string", example: "23321946000100" },
            categoria_ids: {
                type: "array",
                items: { type: "string" },
                example: ["674fa21d79969d2172e78712"]
            },
            secoes_cardapio: {
                type: "array",
                items: { type: "string" },
                example: ["Hambúrgueres", "Bebidas"]
            },
            horario_funcionamento: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        dia: { type: "string", enum: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] },
                        abertura: { type: "string" },
                        fechamento: { type: "string" },
                        fechado: { type: "boolean" }
                    }
                }
            },
            estimativa_entrega_min: { type: "number", example: 25 },
            estimativa_entrega_max: { type: "number", example: 45 },
            taxa_entrega: { type: "number", example: 4.99 }
        },
        required: [],
        description: "Schema para atualização parcial de um restaurante"
    }
};

export default restauranteSchemas;
