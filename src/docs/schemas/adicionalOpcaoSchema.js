// src/docs/schemas/adicionalOpcaoSchema.js

const adicionalOpcaoSchemas = {
    OpcaoListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78720" },
            grupo_id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Cheddar Extra" },
            foto_adicional: { type: "string", example: "https://example.com/cheddar.jpg" },
            preco: { type: "number", example: 3.50 },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de opções de adicionais"
    },

    OpcaoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78720" },
            grupo_id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Cheddar Extra" },
            foto_adicional: { type: "string", example: "https://example.com/cheddar.jpg" },
            preco: { type: "number", example: 3.50 },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de uma opção de adicional"
    },

    OpcaoPost: {
        type: "object",
        properties: {
            grupo_id: { type: "string", description: "ID do grupo de adicionais", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", description: "Nome da opção", example: "Cheddar Extra" },
            foto_adicional: { type: "string", description: "URL da foto", example: "https://example.com/cheddar.jpg" },
            preco: { type: "number", description: "Preço em reais", example: 3.50 }
        },
        required: ["grupo_id", "nome"],
        description: "Schema para criação de uma opção de adicional",
        example: {
            grupo_id: "674fa21d79969d2172e78710",
            nome: "Cheddar Extra",
            foto_adicional: "https://example.com/cheddar.jpg",
            preco: 3.50
        }
    },

    OpcaoPatch: {
        type: "object",
        properties: {
            nome: { type: "string", example: "Cheddar Duplo" },
            foto_adicional: { type: "string", example: "https://example.com/cheddar2.jpg" },
            preco: { type: "number", example: 5.00 },
            ativo: { type: "boolean", example: true }
        },
        required: [],
        description: "Schema para atualização parcial de uma opção de adicional",
        example: {
            nome: "Cheddar Duplo",
            preco: 5.00
        }
    }
};

export default adicionalOpcaoSchemas;
