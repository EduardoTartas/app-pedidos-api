// src/docs/schemas/pratoSchema.js

const pratoSchemas = {
    PratoFiltro: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Filtra por nome" },
            secao: { type: "string", description: "Filtra por seção do cardápio" },
            status: { type: "string", enum: ["ativo", "inativo"], description: "Filtra por status" }
        }
    },

    PratoListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            nome: { type: "string", example: "X-Burguer Especial" },
            foto_prato: { type: "string", example: "https://example.com/xburguer.jpg" },
            preco: { type: "number", example: 29.90 },
            descricao: { type: "string", example: "Hambúrguer artesanal com queijo cheddar e bacon" },
            secao: { type: "string", example: "Hambúrgueres" },
            status: { type: "string", enum: ["ativo", "inativo"], example: "ativo" },
            adicionais_grupo_ids: {
                type: "array",
                items: { type: "string" },
                example: ["674fa21d79969d2172e78713"]
            },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de pratos"
    },

    PratoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            nome: { type: "string", example: "X-Burguer Especial" },
            foto_prato: { type: "string", example: "https://example.com/xburguer.jpg" },
            preco: { type: "number", example: 29.90 },
            descricao: { type: "string", example: "Hambúrguer artesanal com queijo cheddar e bacon" },
            secao: { type: "string", example: "Hambúrgueres" },
            status: { type: "string", enum: ["ativo", "inativo"], example: "ativo" },
            adicionais_grupo_ids: {
                type: "array",
                items: { type: "string" },
                example: ["674fa21d79969d2172e78713"]
            },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de um prato"
    },

    PratoPost: {
        type: "object",
        properties: {
            restaurante_id: { type: "string", description: "ID do restaurante", example: "674fa21d79969d2172e78711" },
            nome: { type: "string", description: "Nome do prato", example: "X-Burguer Especial" },
            foto_prato: { type: "string", description: "URL da foto", example: "https://example.com/xburguer.jpg" },
            preco: { type: "number", description: "Preço em reais", example: 29.90 },
            descricao: { type: "string", description: "Descrição do prato", example: "Hambúrguer artesanal com queijo cheddar e bacon" },
            secao: { type: "string", description: "Seção do cardápio", example: "Hambúrgueres" },
            adicionais_grupo_ids: {
                type: "array",
                items: { type: "string" },
                description: "IDs dos grupos de adicionais vinculados",
                example: ["674fa21d79969d2172e78713"]
            }
        },
        required: ["restaurante_id", "nome", "preco"],
        description: "Schema para criação de um prato",
        example: {
            restaurante_id: "674fa21d79969d2172e78711",
            nome: "X-Burguer Especial",
            foto_prato: "https://example.com/xburguer.jpg",
            preco: 29.90,
            descricao: "Hambúrguer artesanal com queijo cheddar e bacon",
            secao: "Hambúrgueres",
            adicionais_grupo_ids: ["674fa21d79969d2172e78713"]
        }
    },

    PratoPatch: {
        type: "object",
        properties: {
            nome: { type: "string", example: "X-Burguer Premium" },
            foto_prato: { type: "string", example: "https://example.com/xburguer2.jpg" },
            preco: { type: "number", example: 34.90 },
            descricao: { type: "string", example: "Hambúrguer artesanal premium com cheddar duplo" },
            secao: { type: "string", example: "Especiais" },
            status: { type: "string", enum: ["ativo", "inativo"], example: "ativo" },
            adicionais_grupo_ids: {
                type: "array",
                items: { type: "string" },
                example: ["674fa21d79969d2172e78713"]
            }
        },
        required: [],
        description: "Schema para atualização parcial de um prato",
        example: {
            nome: "X-Burguer Premium",
            preco: 34.90,
            descricao: "Hambúrguer artesanal premium com cheddar duplo"
        }
    },

    CardapioResposta: {
        type: "object",
        properties: {
            restaurante: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "674fa21d79969d2172e78711" },
                    nome: { type: "string", example: "Burger House" }
                }
            },
            secoes: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        nome: { type: "string", example: "Hambúrgueres" },
                        pratos: {
                            type: "array",
                            items: { $ref: "#/components/schemas/PratoDetalhes" }
                        }
                    }
                }
            }
        },
        description: "Schema para resposta do cardápio completo de um restaurante"
    }
};

export default pratoSchemas;
