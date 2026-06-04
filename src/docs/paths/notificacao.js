import commonResponses from "../schemas/swaggerCommonResponses.js";

const notificacaoRoutes = {
    "/notificacoes": {
        get: {
            tags: ["Notificações"],
            summary: "Lista notificações do usuário",
            description: `
        + Caso de uso: Permitir que o usuário consulte suas notificações (ou um admin de todos).

        + Função de Negócio:
            - Permitir obter a lista de notificações.
            + Recebe como query parameters (opcionais):
                • filtros: lida (true/false) e usuario_id.

        + Regras de Negócio:
            - Suporte a paginação via parâmetros page e limite.
            - Ordenadas por data de criação (mais recente primeiro).

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **NotificacaoListagem**.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "lida", in: "query", schema: { type: "boolean" }, required: false, description: "Filtra por status de leitura" },
                { name: "tipo", in: "query", schema: { type: "string" }, required: false, description: "Filtra por tipo (ex: pedido_confirmado, geral)" },
                { name: "limite", in: "query", schema: { type: "number" }, required: false, description: "Registros por página" },
                { name: "page", in: "query", schema: { type: "number" }, required: false, description: "Número da página" }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/NotificacaoListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Notificações"],
            summary: "Cria uma nova notificação (Admin/Sistema)",
            description: `
        + Caso de uso: Permitir a criação de uma notificação manual.

        + Regras de Negócio:
            - Envia notificação.
            - Espera campos definidos em NotificacaoPost.

        + Resultado Esperado:
            - HTTP 201 Created com a notificação criada.
      `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/NotificacaoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/NotificacaoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                500: commonResponses[500]()
            }
        }
    },

    "/notificacoes/{id}": {
        get: {
            tags: ["Notificações"],
            summary: "Obtém detalhes de uma notificação",
            description: "Consulta os detalhes de uma notificação específica por ID.",
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID da notificação"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/NotificacaoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Notificações"],
            summary: "Deleta uma notificação",
            description: "Remove uma notificação.",
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID da notificação"
            }],
            responses: {
                200: commonResponses[200](),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        }
    },

    "/notificacoes/{id}/lida": {
        patch: {
            tags: ["Notificações"],
            summary: "Marca uma notificação como lida",
            description: `
            + Caso de uso: Permitir que o usuário marque uma notificação como lida.

            + Função de Negócio:
                - Permitir ao front-end atualizar o status de leitura de uma notificação.
                + Recebe como path parameter:
                    - **id**: identificador da notificação (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o destinatário da notificação pode marcá-la como lida.
                - O campo "lida" é definido como true e "lida_em" recebe a data atual.
                - Se já estiver lida, retorna 409 Conflict.

            + Resultado Esperado:
                - HTTP 200 OK com a notificação atualizada.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID da notificação"
            }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/NotificacaoLidaPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/NotificacaoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                409: commonResponses[409](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default notificacaoRoutes;
