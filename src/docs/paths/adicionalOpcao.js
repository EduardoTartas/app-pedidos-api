// src/docs/paths/adicionalOpcao.js

import commonResponses from "../schemas/swaggerCommonResponses.js";

const adicionalOpcaoRoutes = {
    "/adicionais/opcoes/{grupoId}": {
        get: {
            tags: ["Adicionais - Opções"],
            summary: "Lista opções de um grupo de adicionais",
            description: `
        + Caso de uso: Permitir a consulta das opções de adicionais de um grupo específico.

        + Função de Negócio:
            - Permitir ao front-end obter a lista de opções de um grupo de adicionais.
            + Recebe como path parameter:
                - **grupoId**: identificador do grupo (MongoDB ObjectId).

        + Regras de Negócio:
            - Rota pública, não requer autenticação.
            - Retorna todas as opções vinculadas ao grupo informado.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **OpcaoListagem**.
      `,
            parameters: [{
                name: "grupoId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do grupo de adicionais"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/OpcaoListagem"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        }
    },

    "/adicionais/opcoes": {
        post: {
            tags: ["Adicionais - Opções"],
            summary: "Cria uma nova opção de adicional",
            description: `
            + Caso de uso: Permitir que o dono do restaurante crie uma opção dentro de um grupo de adicionais.

            + Função de Negócio:
                - Permitir ao front-end cadastrar uma opção de adicional.
                + Recebe no corpo da requisição:
                    - **grupo_id**: ID do grupo de adicionais (obrigatório).
                    - **nome**: nome da opção (obrigatório).
                    - **preco**: preço em reais (opcional, padrão: 0).
                    - **foto_adicional**: URL da foto (opcional).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante pode criar opções.
                - O preço não pode ser negativo.

            + Resultado Esperado:
                - HTTP 201 Created retornando a opção criada com ID.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/OpcaoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/OpcaoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/adicionais/opcoes/{id}": {
        patch: {
            tags: ["Adicionais - Opções"],
            summary: "Atualiza parcialmente uma opção de adicional",
            description: `
            + Caso de uso: Permitir que o dono do restaurante atualize dados de uma opção de adicional.

            + Função de Negócio:
                - Permitir ao front-end atualizar uma opção de adicional.
                + Recebe como path parameter:
                    - **id**: identificador da opção (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante pode atualizar.
                - O preço não pode ser negativo.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados da opção.
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
                        schema: { $ref: "#/components/schemas/OpcaoPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/OpcaoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Adicionais - Opções"],
            summary: "Deleta uma opção de adicional",
            description: `
            + Caso de uso: Permitir que o dono do restaurante exclua uma opção de adicional.

            + Função de Negócio:
                - Permitir ao front-end excluir uma opção de adicional.
                + Recebe como path parameter:
                    - **id**: identificador da opção (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administrador pode deletar.

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

export default adicionalOpcaoRoutes;
