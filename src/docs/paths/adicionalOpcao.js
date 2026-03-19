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
    },
    
    "/adicionais/{id}/foto": {
        post: {
            tags: ["Adicionais - Opções"],
            summary: "Faz upload/atualiza a foto de um adicional",
            description: `
            + Caso de uso: Adicionar ou alterar a foto de um adicional.

            + Função de Negócio:
                - Processa um arquivo de imagem, envia para o bucket e associa ao adicional.
                + Recebe via **multipart/form-data**:
                    - \`file\` ou \`imagem\`: O arquivo da foto.

            + Regras de Negócio:
                - Máximo 50MB (definido no serviço) e tipos restritos (jpg, png).
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
                description: "ID do adicional"
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
            tags: ["Adicionais - Opções"],
            summary: "Deleta a foto de um adicional",
            description: `
            + Caso de uso: O adicional deseja remover sua foto.

            + Função de Negócio:
                - Apaga a foto do bucket e define como vazio/null na base de dados.

            + Regras de Negócio:
                - O próprio dono do adicional pode remover a imagem.
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
                description: "ID do adicional"
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

export default adicionalOpcaoRoutes;
