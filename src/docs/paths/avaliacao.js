import commonResponses from "../schemas/swaggerCommonResponses.js";

const avaliacaoRoutes = {
    "/avaliacoes/restaurante/{restauranteId}": {
        get: {
            tags: ["Avaliações"],
            summary: "Lista avaliações de um restaurante",
            description: `
        + Caso de uso: Permitir que qualquer usuário consulte as avaliações de um restaurante.
        
        + Função de Negócio:
            - Permitir ao front-end obter a lista de avaliações com notas e comentários.
            + Recebe como path parameter:
                - **restauranteId**: identificador do restaurante (MongoDB ObjectId).

        + Regras de Negócio:
            - Rota pública (não requer autenticação).
            - Suporte a paginação via parâmetros page e limite.
            - Ordenadas por data de criação (mais recente primeiro).
            - Retorna dados do cliente (nome) e do pedido associado.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **AvaliacaoListagem**.
      `,
            parameters: [
                { name: "restauranteId", in: "path", required: true, schema: { type: "string" }, description: "ID do restaurante" },
                { name: "limite", in: "query", schema: { type: "number" }, required: false, description: "Registros por página" },
                { name: "page", in: "query", schema: { type: "number" }, required: false, description: "Número da página" }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/AvaliacaoListagem"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        }
    },

    "/avaliacoes": {
        post: {
            tags: ["Avaliações"],
            summary: "Cria uma avaliação para um pedido",
            description: `
            + Caso de uso: Permitir que o cliente avalie um pedido entregue.
            
            + Função de Negócio:
                - Permitir ao front-end enviar a avaliação de um pedido com nota e comentário.
                + Recebe no corpo da requisição:
                    - **pedido_id**: ID do pedido (obrigatório).
                    - **nota**: nota de 1 a 5 (obrigatório).
                    - **comentario**: texto opcional de até 500 caracteres.

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o cliente dono do pedido pode avaliar.
                - Apenas pedidos com status "entregue" podem ser avaliados.
                - Cada pedido pode ter apenas uma avaliação.
                - A nota média do restaurante é recalculada automaticamente.
                - O restaurante_id e cliente_id são definidos automaticamente.

            + Resultado Esperado:
                - HTTP 201 Created retornando a avaliação criada.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AvaliacaoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/AvaliacaoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                409: commonResponses[409](),
                422: commonResponses[422](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default avaliacaoRoutes;
