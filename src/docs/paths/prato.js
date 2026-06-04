// src/docs/paths/prato.js

import commonResponses from "../schemas/swaggerCommonResponses.js";
import pratoSchemas from "../schemas/pratoSchema.js";
import { generateParameters } from "./utils/generateParameters.js";

const pratoRoutes = {
    "/pratos": {
        get: {
            tags: ["Pratos"],
            summary: "Lista todos os pratos cadastrados",
            description: `
        + Caso de uso: Permitir que o dono do restaurante liste todos os pratos cadastrados.

        + Função de Negócio:
            - Permitir ao front-end obter uma lista dos pratos cadastrados.
            + Recebe como query parameters (opcionais):
                • filtros: nome, secao, status, restaurante_id.

        + Regras de Negócio:
            - Requer autenticação.
            - O dono do restaurante vê apenas seus próprios pratos.
            - Administradores podem ver todos os pratos.
            - Suporte a paginação via parâmetros page e limite.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **PratoListagem**.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [
                ...generateParameters(pratoSchemas.PratoFiltro),
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
                200: commonResponses[200]("#/components/schemas/PratoListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Pratos"],
            summary: "Cadastra um novo prato",
            description: `
            + Caso de uso: Permitir que o dono do restaurante cadastre um novo prato no cardápio.

            + Função de Negócio:
                - Permitir ao front-end cadastrar um prato.
                + Recebe no corpo da requisição:
                    - **restaurante_id**: ID do restaurante (obrigatório).
                    - **nome**: nome do prato (obrigatório).
                    - **preco**: preço em reais (obrigatório).
                    - **descricao**, **secao**, **foto_prato**, **adicionais_grupo_ids** (opcionais).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante pode cadastrar pratos no mesmo.
                - O corpo da requisição não pode ser vazio.
                - O preço não pode ser negativo.
                - Os grupos de adicionais vinculados devem pertencer ao mesmo restaurante.

            + Resultado Esperado:
                - HTTP 201 Created retornando o prato criado com ID.
        `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/PratoPost" }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/PratoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/pratos/{id}": {
        get: {
            tags: ["Pratos"],
            summary: "Obtém detalhes de um prato",
            description: `
            + Caso de uso: Consulta de detalhes de um prato específico.

            + Função de Negócio:
                - Permitir ao front-end obter todas as informações de um prato.
                + Recebe como path parameter:
                    - **id**: identificador do prato (MongoDB ObjectId).

            + Regras de Negócio:
                - Rota pública, não requer autenticação.
                - Validação do formato do ID.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **PratoDetalhes**.
        `,
            parameters: [{
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/PratoDetalhes"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        },
        patch: {
            tags: ["Pratos"],
            summary: "Atualiza parcialmente um prato",
            description: `
            + Caso de uso: Permitir que o dono do restaurante atualize dados de um prato.

            + Função de Negócio:
                - Permitir ao front-end atualizar um prato.
                + Recebe como path parameter:
                    - **id**: identificador do prato (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administrador pode atualizar o prato.
                - O corpo da requisição não pode ser vazio.
                - O preço não pode ser negativo.
                - Não é permitido alterar o restaurante_id.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do prato.
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
                        schema: { $ref: "#/components/schemas/PratoPatch" }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/PratoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                403: commonResponses[403](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Pratos"],
            summary: "Deleta um prato",
            description: `
            + Caso de uso: Permitir que o dono do restaurante exclua um prato do cardápio.

            + Função de Negócio:
                - Permitir ao front-end excluir um prato.
                + Recebe como path parameter:
                    - **id**: identificador do prato (MongoDB ObjectId).

            + Regras de Negócio:
                - Requer autenticação.
                - Apenas o dono do restaurante ou administrador pode deletar.
                - A existência do prato deve ser verificada.

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
    },

    "/cardapio/{restauranteId}": {
        get: {
            tags: ["Pratos"],
            summary: "Obtém cardápio completo de um restaurante",
            description: `
            + Caso de uso: Consulta do cardápio completo organizado por seções de um restaurante.

            + Função de Negócio:
                - Permitir ao front-end obter todos os pratos agrupados por seção do cardápio.
                + Recebe como path parameter:
                    - **restauranteId**: identificador do restaurante (MongoDB ObjectId).

            + Regras de Negócio:
                - Rota pública, não requer autenticação.
                - Retorna apenas pratos ativos.
                - Os pratos são agrupados por seção do cardápio.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **CardapioResposta**.
        `,
            parameters: [{
                name: "restauranteId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "ID do restaurante"
            }],
            responses: {
                200: commonResponses[200]("#/components/schemas/CardapioResposta"),
                400: commonResponses[400](),
                404: commonResponses[404](),
                500: commonResponses[500]()
            }
        }
    },
    "/pratos/{id}/foto": {
        post: {
            tags: ["Pratos"],
            summary: "Faz upload/atualiza a foto de um prato",
            description: `
            + Caso de uso: Adicionar ou alterar a foto de um prato.

            + Função de Negócio:
                - Processa um arquivo de imagem, envia para o bucket e associa ao prato.
                + Recebe via **multipart/form-data**:
                    - \`file\` ou \`imagem\`: O arquivo da foto.

            + Regras de Negócio:
                - Máximo 50MB (definido no serviço) e tipos restritos (jpg, png, jpeg, svg).
                - O tamanho da imagem vai ser otimizado com redimensionamento para 800x800px e compressão.
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
                description: "ID do prato"
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
            tags: ["Pratos"],
            summary: "Deleta a foto de um prato",
            description: `
            + Caso de uso: O prato deseja remover sua foto.

            + Função de Negócio:
                - Apaga a foto do bucket e define como vazio/null na base de dados.

            + Regras de Negócio:
                - O próprio dono do prato pode remover a imagem.
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
                description: "ID do prato"
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

export default pratoRoutes;
