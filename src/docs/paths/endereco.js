// src/docs/paths/endereco.js

import commonResponses from "../schemas/swaggerCommonResponses.js";

const enderecoRoutes = {
    // === Endereços de Usuário ===
    "/usuarios/{usuarioId}/enderecos": {
        get: {
            tags: ["Endereços"],
            summary: "Lista todos os endereços de um usuário",
            description: `
        + Caso de uso: Permitir que o usuário visualize todos os seus endereços cadastrados.

        + Função de Negócio:
            - Retornar a lista de endereços vinculados ao usuário.
            + Recebe como path parameter:
                - **usuarioId**: identificador do usuário (MongoDB ObjectId).

        + Regras de Negócio:
            - Requer autenticação.
            - Usuários comuns podem ver apenas seus próprios endereços.
            - Administradores podem ver endereços de qualquer usuário.
            - Um usuário pode ter múltiplos endereços.

        + Resultado Esperado:
            - 200 OK com array de endereços.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "usuarioId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do usuário"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/EnderecoListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Endereços"],
            summary: "Cadastra um novo endereço para o usuário",
            description: `
            + Caso de uso: Permitir que o usuário adicione um novo endereço.

            + Função de Negócio:
                - Criar um novo endereço vinculado ao usuário.
                + Recebe como path parameter:
                    - **usuarioId**: identificador do usuário (MongoDB ObjectId).
                + Recebe no corpo da requisição os campos do endereço.

            + Regras de Negócio:
                - Requer autenticação.
                - Usuários comuns podem adicionar endereços apenas a si mesmos.
                - Se o campo **principal** for true, os demais endereços do usuário são desmarcados como principal.
                - Um usuário pode ter múltiplos endereços.

            + Resultado Esperado:
                - HTTP 201 Created retornando o endereço criado.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "usuarioId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do usuário"
            }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/EnderecoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/EnderecoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/usuarios/{usuarioId}/enderecos/{enderecoId}": {
        patch: {
            tags: ["Endereços"],
            summary: "Atualiza parcialmente um endereço do usuário",
            description: `
            + Caso de uso: Permitir que o usuário atualize um de seus endereços.

            + Função de Negócio:
                - Atualizar campos do endereço vinculado ao usuário.
                + Recebe como path parameters:
                    - **usuarioId**: identificador do usuário.
                    - **enderecoId**: identificador do endereço.

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o próprio usuário ou administradores podem atualizar.
                - O endereço deve pertencer ao usuário informado.
                - Se **principal** for true, desmarca os demais.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do endereço.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "usuarioId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do usuário"
                },
                {
                    name: "enderecoId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do endereço"
                }
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/EnderecoPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/EnderecoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Endereços"],
            summary: "Remove um endereço do usuário",
            description: `
            + Caso de uso: Permitir que o usuário remova um de seus endereços.

            + Função de Negócio:
                - Deletar o endereço vinculado ao usuário.
                + Recebe como path parameters:
                    - **usuarioId**: identificador do usuário.
                    - **enderecoId**: identificador do endereço.

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o próprio usuário ou administradores podem remover.
                - O endereço deve pertencer ao usuário informado.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de sucesso.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "usuarioId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do usuário"
                },
                {
                    name: "enderecoId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do endereço"
                }
            ],
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
    },

    // === Endereço de Restaurante ===
    "/restaurantes/{restauranteId}/enderecos": {
        get: {
            tags: ["Endereços"],
            summary: "Obtém o endereço de um restaurante",
            description: `
        + Caso de uso: Permitir que qualquer usuário veja o endereço de um restaurante.

        + Função de Negócio:
            - Retornar o endereço do restaurante.
            + Recebe como path parameter:
                - **restauranteId**: identificador do restaurante (MongoDB ObjectId).

        + Regras de Negócio:
            - Rota pública, não requer autenticação.
            - Um restaurante pode ter no máximo um endereço.

        + Resultado Esperado:
            - 200 OK com o endereço do restaurante ou null.
      `,
            parameters: [{
                name: "restauranteId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do restaurante"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/EnderecoDetalhes"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Endereços"],
            summary: "Cadastra o endereço do restaurante",
            description: `
            + Caso de uso: Permitir que o dono cadastre o endereço do restaurante.

            + Função de Negócio:
                - Criar o endereço vinculado ao restaurante.
                + Recebe como path parameter:
                    - **restauranteId**: identificador do restaurante.
                + Recebe no corpo da requisição os campos do endereço.

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administradores podem cadastrar.
                - Um restaurante pode ter somente um endereço.
                - Se já existir um endereço, retorna HTTP 409 Conflict.

            + Resultado Esperado:
                - HTTP 201 Created retornando o endereço criado.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "restauranteId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do restaurante"
            }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/EnderecoRestaurantePost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/EnderecoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                409: commonResponses[409](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/restaurantes/{restauranteId}/enderecos/{enderecoId}": {
        patch: {
            tags: ["Endereços"],
            summary: "Atualiza o endereço do restaurante",
            description: `
            + Caso de uso: Permitir que o dono atualize o endereço do restaurante.

            + Função de Negócio:
                - Atualizar campos do endereço do restaurante.
                + Recebe como path parameters:
                    - **restauranteId**: identificador do restaurante.
                    - **enderecoId**: identificador do endereço.

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administradores podem atualizar.
                - O endereço deve pertencer ao restaurante informado.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do endereço.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "restauranteId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do restaurante"
                },
                {
                    name: "enderecoId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do endereço"
                }
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/EnderecoPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/EnderecoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Endereços"],
            summary: "Remove o endereço do restaurante",
            description: `
            + Caso de uso: Permitir que o dono remova o endereço do restaurante.

            + Função de Negócio:
                - Deletar o endereço vinculado ao restaurante.
                + Recebe como path parameters:
                    - **restauranteId**: identificador do restaurante.
                    - **enderecoId**: identificador do endereço.

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administradores podem remover.
                - O endereço deve pertencer ao restaurante informado.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de sucesso.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "restauranteId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do restaurante"
                },
                {
                    name: "enderecoId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID do endereço"
                }
            ],
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

export default enderecoRoutes;
