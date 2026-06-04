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
            icone_categoria: { type: "string", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para listagem de categorias"
    },

    CategoriaDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "Lanches" },
            icone_categoria: { type: "string", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            ativo: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" },
            updatedAt: { type: "string", format: "date-time", example: "2025-01-16T12:00:00.000Z" }
        },
        description: "Schema para detalhes de uma categoria"
    },

    CategoriaPost: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome da categoria", example: "Lanches" },
            icone_categoria: { type: "string", description: "URL da imagem da categoria", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" }
        },
        required: ["nome"],
        description: "Schema para criação de uma categoria",
        example: {
            nome: "Lanches",
            icone_categoria: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg"
        }
    },

    CategoriaPatch: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome da categoria", example: "Hambúrgueres" },
            icone_categoria: { type: "string", description: "URL da imagem", example: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg" },
            ativo: { type: "boolean", description: "Status ativo/inativo", example: true }
        },
        required: [],
        description: "Schema para atualização parcial de uma categoria",
        example: {
            nome: "Hambúrgueres",
            icone_categoria: "https://rango.web.fslab.dev/eb167c13-3fc8-4c17-91ed-f331005a.jpeg"
        }
    }
};

export default categoriaSchemas;
