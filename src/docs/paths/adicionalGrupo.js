// src/docs/paths/adicionalGrupo.js

import commonResponses from "../schemas/swaggerCommonResponses.js";

const adicionalGrupoRoutes = {
    "/adicionais/grupos/prato/{pratoId}": {
        get: {
            tags: ["Adicionais - Grupos"],
            summary: "Lista grupos de adicionais de um prato",
            description: `
        + Caso de uso: Permitir a consulta dos grupos de adicionais vinculados a um prato específico.

        + Função de Negócio:
            - Permitir ao front-end obter todos os grupos de adicionais de um prato.
            + Recebe como path parameter:
                - **pratoId**: identificador do prato (MongoDB ObjectId).

        + Regras de Negócio:
            - Rota pública, não requer autenticação.
            - Retorna apenas grupos com status ativo.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **GrupoListagem**.
      `,
            parameters: [{
                name: "pratoId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do prato"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/GrupoListagem"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        }
    },

    "/adicionais/grupos": {
        post: {
            tags: ["Adicionais - Grupos"],
            summary: "Cria um novo grupo de adicionais",
            description: `
            + Caso de uso: Permitir que o dono do restaurante crie um grupo de adicionais (ex.: Molhos, Tamanhos).

            + Função de Negócio:
                - Permitir ao front-end cadastrar um grupo de adicionais.
                + Recebe no corpo da requisição:
                    - **prato_id**: ID do prato ao qual o grupo será vinculado (obrigatório).
                    - **nome**: nome do grupo (obrigatório).
                    - **tipo**: "adicional" ou "variacao" (opcional, padrão: "adicional").
                    - **obrigatorio**, **min**, **max** (opcionais).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante pode criar grupos.
                - O campo min não pode ser negativo e max deve ser >= 1.

            + Resultado Esperado:
                - HTTP 201 Created retornando o grupo criado com ID.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/GrupoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/GrupoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/adicionais/grupos/{id}": {
        get: {
            tags: ["Adicionais - Grupos"],
            summary: "Busca um grupo de adicionais pelo ID",
            description: `
            + Caso de uso: Permitir a consulta de um grupo de adicionais específico pelo seu ID.

            + Função de Negócio:
                - Permitir ao front-end obter os detalhes de um grupo de adicionais.
                + Recebe como path parameter:
                    - **id**: identificador do grupo (MongoDB ObjectId).

            + Regras de Negócio:
                - Rota pública, não requer autenticação.
                - Retorna erro 404 se o grupo não for encontrado.

            + Resultado Esperado:
                - 200 OK com corpo conforme schema **GrupoDetalhes**.
        `,
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do grupo de adicionais"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/GrupoDetalhes"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        patch: {
            tags: ["Adicionais - Grupos"],
            summary: "Atualiza parcialmente um grupo de adicionais",
            description: `
            + Caso de uso: Permitir que o dono do restaurante atualize dados de um grupo de adicionais.

            + Função de Negócio:
                - Permitir ao front-end atualizar um grupo de adicionais.
                + Recebe como path parameter:
                    - **id**: identificador do grupo (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante pode atualizar.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do grupo.
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
                        schema: { $ref: "#/components/schemas/GrupoPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/GrupoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Adicionais - Grupos"],
            summary: "Deleta um grupo de adicionais",
            description: `
            + Caso de uso: Permitir que o dono do restaurante exclua um grupo de adicionais.

            + Função de Negócio:
                - Permitir ao front-end excluir um grupo de adicionais.
                + Recebe como path parameter:
                    - **id**: identificador do grupo (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administrador pode deletar.
                - Deleta em cascata todas as opções vinculadas ao grupo.

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
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default adicionalGrupoRoutes;
