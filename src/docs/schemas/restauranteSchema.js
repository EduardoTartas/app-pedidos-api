// src/docs/schemas/restauranteSchema.js

const restauranteSchemas = {
    RestauranteFiltro: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Filtra por nome" },
            status: { type: "string", enum: ["aberto", "fechado", "inativo"], description: "Filtra por status" }
        }
    },

    RestauranteListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Burger House" },
            foto_restaurante: { type: "string", example: "https://example.com/burger.jpg" },
            dono_id: { type: "string", example: "674fa21d79969d2172e78711" },
            cnpj: { type: "string", example: "12345678000195" },
            status: { type: "string", enum: ["aberto", "fechado", "inativo"], example: "aberto" },
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
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de restaurantes"
    },

    RestauranteDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Burger House" },
            foto_restaurante: { type: "string", example: "https://example.com/burger.jpg" },
            dono_id: { type: "string", example: "674fa21d79969d2172e78711" },
            cnpj: { type: "string", example: "12345678000195" },
            status: { type: "string", enum: ["aberto", "fechado", "inativo"], example: "aberto" },
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
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de um restaurante"
    },

    RestaurantePost: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome do restaurante", example: "Burger House" },
            foto_restaurante: { type: "string", description: "URL da foto do restaurante", example: "https://example.com/burger.jpg" },
            cnpj: { type: "string", description: "CNPJ do restaurante (opcional, 14 dígitos)", example: "12345678000195" },
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
            estimativa_entrega_min: { type: "number", description: "Tempo mínimo de entrega (min)", example: 30 },
            estimativa_entrega_max: { type: "number", description: "Tempo máximo de entrega (min)", example: 50 },
            taxa_entrega: { type: "number", description: "Taxa de entrega em reais", example: 5.99 }
        },
        required: ["nome"],
        description: "Schema para criação de um restaurante",
        example: {
            nome: "Burger House",
            foto_restaurante: "https://example.com/burger.jpg",
            cnpj: "12345678000195",
            categoria_ids: ["674fa21d79969d2172e78712"],
            secoes_cardapio: ["Hambúrgueres", "Bebidas", "Sobremesas"],
            estimativa_entrega_min: 30,
            estimativa_entrega_max: 50,
            taxa_entrega: 5.99
        }
    },

    RestaurantePatch: {
        type: "object",
        properties: {
            nome: { type: "string", example: "Burger House Premium" },
            foto_restaurante: { type: "string", example: "https://example.com/burger2.jpg" },
            status: { type: "string", enum: ["aberto", "fechado", "inativo"], example: "aberto" },
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
            estimativa_entrega_min: { type: "number", example: 25 },
            estimativa_entrega_max: { type: "number", example: 45 },
            taxa_entrega: { type: "number", example: 4.99 }
        },
        required: [],
        description: "Schema para atualização parcial de um restaurante",
        example: {
            nome: "Burger House Premium",
            status: "aberto",
            taxa_entrega: 4.99
        }
    }
};

export default restauranteSchemas;
