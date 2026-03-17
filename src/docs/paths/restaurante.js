// src/docs/paths/restaurante.js

import commonResponses from "../schemas/swaggerCommonResponses.js";
import restauranteSchemas from "../schemas/restauranteSchema.js";
import { generateParameters } from "./utils/generateParameters.js";

const restauranteRoutes = {
    "/restaurantes": {
        get: {
            tags: ["Restaurantes"],
            summary: "Lista todos os restaurantes cadastrados",
            description: `
        + Caso de uso: Permitir que qualquer usuário liste os restaurantes disponíveis na plataforma.

        + Função de Negócio:
            - Permitir ao front-end obter uma lista dos restaurantes cadastrados.
            + Recebe como query parameters (opcionais):
                • filtros: nome e status.

        + Regras de Negócio:
            - Rota pública, não requer autenticação.
            - A listagem deve ocorrer mesmo se nenhum filtro for enviado.
            - Suporte a paginação via parâmetros page e limite.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **RestauranteListagem**, contendo:
                • **items**: array de restaurantes.
      `,
            parameters: [
                ...generateParameters(restauranteSchemas.RestauranteFiltro),
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
                200: commonResponses[200]("#/components/schemas/RestauranteListagem"),
                400: commonResponses[400](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Restaurantes"],
            summary: "Cadastra um novo restaurante",
            description: `
            + Caso de uso: Permitir que um usuário autenticado cadastre um novo restaurante.

            + Função de Negócio:
                - Permitir ao front-end cadastrar um restaurante.
                + Recebe no corpo da requisição:
                    - **nome**: nome do restaurante (obrigatório).
                    - **categoria_ids**: IDs das categorias.
                    - **secoes_cardapio**: seções do cardápio.
                    - Demais campos opcionais.

            + Regras de Negócio:
                - Requer autenticação.
                - O dono_id é automaticamente atribuído ao usuário autenticado.
                - O status inicial é "fechado".

            + Resultado Esperado:
                - HTTP 201 Created retornando o restaurante criado com ID.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/RestaurantePost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/RestauranteDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/restaurantes/{id}": {
        get: {
            tags: ["Restaurantes"],
            summary: "Obtém detalhes de um restaurante",
            description: `
            + Caso de uso: Consulta de detalhes de um restaurante específico.

            + Função de Negócio:
                - Permitir ao front-end obter todas as informações de um restaurante.
                + Recebe como path parameter:
                    - **id**: identificador do restaurante (MongoDB ObjectId).

            + Regras de Negócio:
                - Rota pública, não requer autenticação.
                - Validação do formato do ID.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **RestauranteDetalhes**.
        `,
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/RestauranteDetalhes"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        patch: {
            tags: ["Restaurantes"],
            summary: "Atualiza parcialmente um restaurante",
            description: `
            + Caso de uso: Permitir que o dono atualize dados do restaurante.

            + Função de Negócio:
                - Permitir ao front-end atualizar um restaurante.
                + Recebe como path parameter:
                    - **id**: identificador do restaurante (MongoDB ObjectId).

            + Regras de Negócio:
                - Apenas o dono do restaurante ou administradores podem atualizar.
                - Os dados enviados devem seguir o RestaurantePatchSchema.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do restaurante.
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
                        schema: { $ref: "#/components/schemas/RestaurantePatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/RestauranteDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Restaurantes"],
            summary: "Deleta um restaurante",
            description: `
            + Caso de uso: Permitir que o dono ou administrador exclua um restaurante.

            + Função de Negócio:
                - Permitir ao front-end excluir um restaurante.
                + Recebe como path parameter:
                    - **id**: identificador do restaurante (MongoDB ObjectId).

            + Regras de Negócio:
                - Apenas o dono do restaurante ou administradores podem deletar.
                - Verificar se existem pedidos ativos antes da exclusão.
                - A existência do restaurante deve ser verificada.

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
    },
    "/restaurantes/{id}/foto": {
        post: {
            tags: ["Restaurantes"],
            summary: "Faz upload/atualiza a foto de um restaurante",
            description: `
            + Caso de uso: Adicionar ou alterar a foto de um restaurante.

            + Função de Negócio:
                - Processa um arquivo de imagem, envia para o bucket e associa ao restaurante.
                + Recebe via **multipart/form-data**:
                    - \`file\` ou \`imagem\`: O arquivo da foto.

            + Regras de Negócio:
                - Máximo 50MB (definido no serviço) e tipos restritos (jpg, png).
                - A imagem antiga é apagada automaticamente.
                - O próprio dono do restaurante pode realizar esta ação.

            + Resultado Esperado:
                - HTTP 200 OK com link da imagem carregada.
            `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do restaurante"
            }],
            requestBody: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                file: {
                                    type: "string",
                                    format: "binary",
                                    description: "Arquivo de imagem (JPEG, PNG, etc)"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: commonResponses[200](),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Restaurantes"],
            summary: "Deleta a foto de perfil do restaurante",
            description: `
            + Caso de uso: O restaurante deseja remover sua foto de perfil.

            + Função de Negócio:
                - Apaga a foto do bucket e define como vazio/null na base de dados.

            + Regras de Negócio:
                - O próprio dono do restaurante pode remover a imagem.
                - A remoção real do arquivo pode ocorrer de forma silenciosa ou síncrona.

            + Resultado Esperado:
                - HTTP 200 OK informando o sucesso da remoção.
            `,
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do restaurante"
            }],
            responses: {
                200: commonResponses[200](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        }
    }
};

export default restauranteRoutes;
