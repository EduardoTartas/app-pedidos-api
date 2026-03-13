import commonResponses from "../schemas/swaggerCommonResponses.js";

const notificacaoRoutes = {
    "/notificacoes": {
        get: {
            tags: ["Notificações"],
            summary: "Lista notificações do usuário autenticado",
            description: `
        + Caso de uso: Permitir que o usuário consulte suas notificações.
        
        + Função de Negócio:
            - Permitir ao front-end obter a lista de notificações do usuário logado.
            + Recebe como query parameters (opcionais):
                • filtros: lida (true/false).

        + Regras de Negócio:
            - Requer autenticação.
            - Retorna apenas notificações do usuário autenticado (usuario_id = usuário logado).
            - Suporte a paginação via parâmetros page e limite.
            - Ordenadas por data de criação (mais recente primeiro).

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **NotificacaoListagem**.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "lida", in: "query", schema: { type: "boolean" }, required: false, description: "Filtra por status de leitura" },
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
            
            }
        }
    }
};

export default notificacaoRoutes;