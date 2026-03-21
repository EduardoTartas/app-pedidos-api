// src/docs/schemas/categoriaSchema.js

const categoriaSchemas = {
    CategoriaFiltro: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Filtra por nome" },
            ativo: { type: "boolean", description: "Filtra por status ativo" }
        }
    },

    CategoriaListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Lanches" },
            icone_categoria: { type: "string", example: "https://example.com/lanches.jpg" },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de categorias"
    },

    CategoriaDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Lanches" },
            icone_categoria: { type: "string", example: "https://example.com/lanches.jpg" },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de uma categoria"
    },

    CategoriaPost: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome da categoria", example: "Lanches" },
            icone_categoria: { type: "string", description: "URL da imagem da categoria", example: "https://example.com/lanches.jpg" }
        },
        required: ["nome"],
        description: "Schema para criação de uma categoria",
        example: {
            nome: "Lanches",
            icone_categoria: "https://example.com/lanches.jpg"
        }
    },

    CategoriaPatch: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome da categoria", example: "Hambúrgueres" },
            icone_categoria: { type: "string", description: "URL da imagem", example: "https://example.com/hamburgueres.jpg" },
            ativo: { type: "boolean", description: "Status ativo/inativo", example: true }
        },
        required: [],
        description: "Schema para atualização parcial de uma categoria",
        example: {
            nome: "Hambúrgueres",
            icone_categoria: "https://example.com/hamburgueres.jpg"
        }
    }
};

export default categoriaSchemas;
