// src/docs/paths/adicionalGrupo.js

import commonResponses from "../schemas/swaggerCommonResponses.js";

const adicionalGrupoRoutes = {
    "/adicionais/grupos/{restauranteId}": {
        get: {
            tags: ["Adicionais - Grupos"],
            summary: "Lista grupos de adicionais de um restaurante",
            description: `
        + Caso de uso: Permitir a consulta dos grupos de adicionais cadastrados para um restaurante.

        + Função de Negócio:
            - Permitir ao front-end obter a lista de grupos de adicionais de um restaurante.
            + Recebe como path parameter:
                - **restauranteId**: identificador do restaurante (MongoDB ObjectId).

        + Regras de Negócio:
            - Rota pública, não requer autenticação.
            - Retorna todos os grupos vinculados ao restaurante informado.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **GrupoListagem**, contendo:
                • **items**: array de grupos de adicionais.
      `,
            parameters: [{
                name: "restauranteId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do restaurante"
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
