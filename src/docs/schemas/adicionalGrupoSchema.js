// src/docs/schemas/adicionalGrupoSchema.js

const adicionalGrupoSchemas = {
    GrupoFiltro: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Filtra por nome" },
            tipo: { type: "string", enum: ["adicional", "variacao"], description: "Filtra por tipo" }
        }
    },

    GrupoListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            nome: { type: "string", example: "Molhos Extras" },
            tipo: { type: "string", enum: ["adicional", "variacao"], example: "adicional" },
            obrigatorio: { type: "boolean", example: false },
            min: { type: "number", example: 0 },
            max: { type: "number", example: 3 },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de grupos de adicionais"
    },

    GrupoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            restaurante_id: { type: "string", example: "674fa21d79969d2172e78711" },
            nome: { type: "string", example: "Molhos Extras" },
            tipo: { type: "string", enum: ["adicional", "variacao"], example: "adicional" },
            obrigatorio: { type: "boolean", example: false },
            min: { type: "number", example: 0 },
            max: { type: "number", example: 3 },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de um grupo de adicionais"
    },

    GrupoPost: {
        type: "object",
        properties: {
            prato_id: { type: "string", description: "ID do prato ao qual o grupo será vinculado", example: "674fa21d79969d2172e78712" },
            nome: { type: "string", description: "Nome do grupo", example: "Molhos Extras" },
            tipo: { type: "string", enum: ["adicional", "variacao"], description: "Tipo do grupo", example: "adicional" },
            obrigatorio: { type: "boolean", description: "Se é obrigatório selecionar", example: false },
            min: { type: "number", description: "Mínimo de seleções", example: 0 },
            max: { type: "number", description: "Máximo de seleções", example: 3 }
        },
        required: ["prato_id", "nome"],
        description: "Schema para criação de um grupo de adicionais",
        example: {
            prato_id: "674fa21d79969d2172e78712",
            nome: "Molhos Extras",
            tipo: "adicional",
            obrigatorio: false,
            min: 0,
            max: 3
        }
    },

    GrupoPatch: {
        type: "object",
        properties: {
            nome: { type: "string", example: "Molhos Premium" },
            tipo: { type: "string", enum: ["adicional", "variacao"], example: "adicional" },
            obrigatorio: { type: "boolean", example: true },
            min: { type: "number", example: 1 },
            max: { type: "number", example: 5 },
            ativo: { type: "boolean", example: true }
        },
        required: [],
        description: "Schema para atualização parcial de um grupo de adicionais",
        example: {
            nome: "Molhos Premium",
            max: 5
        }
    }
};

export default adicionalGrupoSchemas;
