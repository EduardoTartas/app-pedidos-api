// src/docs/paths/pedido.js

import commonResponses from "../schemas/swaggerCommonResponses.js";

const pedidoRoutes = {
    "/pedidos/meus": {
        get: {
            tags: ["Pedidos"],
            summary: "Lista os pedidos do cliente autenticado",
            description: `
        + Caso de uso: Permitir que o cliente consulte o histórico dos seus pedidos.

        + Função de Negócio:
            - Permitir ao front-end obter a lista de pedidos do usuário logado.
            + Recebe como query parameters (opcionais):
                • filtros: status.

        + Regras de Negócio:
            - Requer autenticação.
            - Retorna apenas pedidos do cliente autenticado (cliente_id = usuário logado).
            - Suporte a paginação via parâmetros page e limite.
            - Ordenados por data de criação (mais recente primeiro).

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **PedidoListagem**.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "status", in: "query", schema: { type: "string", enum: ["criado", "em_preparo", "a_caminho", "entregue", "cancelado"] }, required: false, description: "Filtra por status" },
                { name: "data_inicio", in: "query", schema: { type: "string", format: "date", example: "2024-01-01" }, required: false, description: "Filtro: Período Inicial (YYYY-MM-DD)" },
                { name: "data_fim", in: "query", schema: { type: "string", format: "date", example: "2024-12-31" }, required: false, description: "Filtro: Período Final (YYYY-MM-DD)" },
                { name: "limite", in: "query", schema: { type: "number" }, required: false, description: "Registros por página" },
                { name: "page", in: "query", schema: { type: "number" }, required: false, description: "Número da página" }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/PedidoListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/pedidos/restaurante/{restauranteId}": {
        get: {
            tags: ["Pedidos"],
            summary: "Lista pedidos recebidos por um restaurante",
            description: `
        + Caso de uso: Permitir que o dono do restaurante consulte os pedidos recebidos.

        + Função de Negócio:
            - Permitir ao front-end obter a lista de pedidos de um restaurante específico.
            + Recebe como path parameter:
                - **restauranteId**: identificador do restaurante (MongoDB ObjectId).

        + Regras de Negócio:
            - Requer autenticação.
            - Apenas o dono do restaurante ou administradores podem listar.
            - Suporte a filtro por status e paginação.
            - Ordenados por data de criação (mais recente primeiro).

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **PedidoListagem**.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "restauranteId", in: "path", required: true, schema: { type: "string" }, description: "ID do restaurante" },
                { name: "status", in: "query", schema: { type: "string", enum: ["criado", "em_preparo", "a_caminho", "entregue", "cancelado"] }, required: false, description: "Filtra por status" },
                { name: "limite", in: "query", schema: { type: "number" }, required: false, description: "Registros por página" },
                { name: "page", in: "query", schema: { type: "number" }, required: false, description: "Número da página" }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/PedidoListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/pedidos": {
        post: {
            tags: ["Pedidos"],
            summary: "Cria um novo pedido",
            description: `
            + Caso de uso: Permitir que o cliente crie um pedido em um restaurante.

            + Função de Negócio:
                - Permitir ao front-end criar um pedido de delivery.
                + Recebe no corpo da requisição:
                    - **restaurante_id**: ID do restaurante (obrigatório).
                    - **itens**: array de itens com prato_id, quantidade e adicionais (obrigatório).

            + Regras de Negócio:
                - Requer autenticação.
                - O restaurante deve estar com status "aberto".
                - Os pratos devem estar ativos e pertencer ao restaurante.
                - Adicionais devem respeitar min/max dos grupos.
                - O sistema calcula automaticamente subtotal, taxa de entrega e total.
                - Preços são obtidos do banco (não confiados no front-end).
                - Status inicial: "criado".
                - Notificação é gerada para o dono do restaurante.

            + Resultado Esperado:
                - HTTP 201 Created retornando o pedido criado com totais calculados.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/PedidoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/PedidoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                422: commonResponses[422](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/pedidos/{id}/status": {
        patch: {
            tags: ["Pedidos"],
            summary: "Atualiza status de um pedido",
            description: `
            + Caso de uso: Permitir que o dono do restaurante ou cliente atualize o status do pedido.

            + Função de Negócio:
                - Permitir ao front-end avançar o status do pedido na esteira de entrega.
                + Recebe como path parameter:
                    - **id**: identificador do pedido (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Fluxo de status permitido:
                    • criado → em_preparo (dono do restaurante)
                    • em_preparo → a_caminho (dono do restaurante)
                    • a_caminho → entregue (dono do restaurante)
                    • criado/em_preparo → cancelado (cliente ou dono)
                - Não é possível retroceder status.
                - Pedidos já entregues ou cancelados não podem ser alterados.
                - Notificação é gerada para o cliente a cada mudança de status.
                - O histórico de status é atualizado automaticamente.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do pedido.
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
                        schema: { $ref: "#/components/schemas/PedidoStatusUpdate" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/PedidoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                422: commonResponses[422](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default pedidoRoutes;
