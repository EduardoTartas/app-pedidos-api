// src/docs/paths/categoria.js

import commonResponses from "../schemas/swaggerCommonResponses.js";
import categoriaSchemas from "../schemas/categoriaSchema.js";
import { generateParameters } from "./utils/generateParameters.js";

const categoriaRoutes = {
    "/categorias": {
        get: {
            tags: ["Categorias"],
            summary: "Lista todas as categorias cadastradas",
            description: `
        + Caso de uso: Permitir que qualquer usuário liste todas as categorias de restaurantes disponíveis.
        
        + Função de Negócio:
            - Permitir ao front-end obter uma lista das categorias cadastradas.
            + Recebe como query parameters (opcionais):
                • filtros: nome e ativo.

        + Regras de Negócio:
            - Rota pública, não requer autenticação.
            - A listagem deve ocorrer mesmo se nenhum filtro for enviado.
            - Suporte a paginação via parâmetros page e limite.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **CategoriaListagem**, contendo:
                • **items**: array de categorias.
      `,
            parameters: [
                ...generateParameters(categoriaSchemas.CategoriaFiltro),
                {
                    name: "limite",
                    in: "query",
                    schema: { type: "number" },
                    required: false,
                    description: "Quantidade de registros por página"
                },
                {
                    name: "page",
                    in: "query",
                    schema: { type: "number" },
                    required: false,
                    description: "Número da página"
                }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/CategoriaListagem"),
                400: commonResponses[400](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Categorias"],
            summary: "Cadastra uma nova categoria",
            description: `
            + Caso de uso: Permitir que o administrador cadastre uma nova categoria de restaurante.
            
            + Função de Negócio:
                - Permitir ao front-end cadastrar uma categoria.
                + Recebe no corpo da requisição:
                    - **nome**: nome da categoria (obrigatório, único).
                    - **img**: URL da imagem da categoria (opcional).

            + Regras de Negócio:
                - O campo nome é obrigatório e deve ser único.
                - Apenas administradores podem criar categorias.

            + Resultado Esperado:
                - HTTP 201 Created retornando a categoria criada com ID.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CategoriaPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/CategoriaDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                409: commonResponses[409](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/categorias/{id}": {
        get: {
            tags: ["Categorias"],
            summary: "Obtém detalhes de uma categoria",
            description: `
            + Caso de uso: Consulta de detalhes de uma categoria específica.
            
            + Função de Negócio:
                - Permitir ao front-end obter todas as informações de uma categoria.
                + Recebe como path parameter:
                    - **id**: identificador da categoria (MongoDB ObjectId).

            + Regras de Negócio:
                - Rota pública, não requer autenticação.
                - Validação do formato do ID.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **CategoriaDetalhes**.
        `,
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/CategoriaDetalhes"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        patch: {
            tags: ["Categorias"],
            summary: "Atualiza parcialmente uma categoria",
            description: `
            + Caso de uso: Permitir que o administrador atualize dados de uma categoria.
            
            + Função de Negócio:
                - Permitir ao front-end atualizar uma categoria.
                + Recebe como path parameter:
                    - **id**: identificador da categoria (MongoDB ObjectId).

            + Regras de Negócio:
                - Apenas administradores podem atualizar categorias.
                - Não deve permitir nomes duplicados.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados da categoria.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
            }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CategoriaPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/CategoriaDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                409: commonResponses[409](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Categorias"],
            summary: "Deleta uma categoria",
            description: `
            + Caso de uso: Permitir que o administrador exclua uma categoria.
            
            + Função de Negócio:
                - Permitir ao front-end excluir uma categoria.
                + Recebe como path parameter:
                    - **id**: identificador da categoria (MongoDB ObjectId).

            + Regras de Negócio:
                - Apenas administradores podem deletar categorias.
                - Verificar se a categoria está vinculada a restaurantes antes da exclusão.
                - A existência da categoria deve ser verificada.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de sucesso.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
            }],
            responses: {
                200: commonResponses[200](),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default categoriaRoutes;
