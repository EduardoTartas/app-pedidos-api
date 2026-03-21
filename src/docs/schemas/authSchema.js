// src/docs/schemas/authSchema.js

const authSchemas = {
    loginPost: {
        type: "object",
        properties: {
            email: {
                type: "string",
                format: "email",
                description: "Email do usuário cadastrado",
                example: "joao.silva@email.com"
            },
            senha: {
                type: "string",
                description: "Senha do usuário",
                example: "Senha@123"
            }
        },
        required: ["email", "senha"],
        description: "Schema para login de usuário",
        example: {
            email: "admin@delivery.com",
            senha: "Senha123"
        }
    },

    signupPost: {
        type: "object",
        properties: {
            nome: {
                type: "string",
                description: "Nome completo do usuário",
                example: "João da Silva"
            },
            email: {
                type: "string",
                format: "email",
                description: "Email do usuário",
                example: "admin@delivery.com"
            },
            senha: {
                type: "string",
                description: "Senha (mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial)",
                example: "Senha123"
            },
            cpf: {
                type: "string",
                description: "CPF do usuário",
                example: "12345678900"
            },
            telefone: {
                type: "string",
                description: "Telefone de contato",
                example: "69999998888"
            }
        },
        required: ["nome", "email", "senha"],
        description: "Schema para cadastro de novo usuário",
        example: {
            nome: "João da Silva",
            email: "admin@delivery.com",
            senha: "Senha123",
            cpf: "12345678900",
            telefone: "69999998888",
        }
    },

    signupPostDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "João da Silva" },
            email: { type: "string", example: "admin@delivery.com" },
            cpf: { type: "string", example: "12345678900" },
            telefone: { type: "string", example: "69999998888" },
            status: { type: "string", example: "ativo" },
            isAdmin: { type: "boolean", example: false },
            foto_perfil: { type: "string", example: "" },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes do cadastro de usuário"
    },

    RespostaLogin: {
        type: "object",
        properties: {
            accessToken: {
                type: "string",
                description: "JWT de acesso (expira em 15 minutos)",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            },
            refreshToken: {
                type: "string",
                description: "JWT para renovação (expira em 7 dias)",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            },
            user: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "674fa21d79969d2172e78710" },
                    nome: { type: "string", example: "João da Silva" },
                    email: { type: "string", example: "admin@delivery.com" },
                    isAdmin: { type: "boolean", example: false }
                }
            }
        },
        description: "Schema para resposta de login com tokens JWT"
    },

    RequisicaoRecuperaSenha: {
        type: "object",
        properties: {
            email: {
                type: "string",
                format: "email",
                description: "Email cadastrado para recuperação de senha",
                example: "admin@delivery.com"
            }
        },
        required: ["email"],
        description: "Schema para requisição de recuperação de senha",
        example: {
            email: "admin@delivery.com"
        }
    },

    RespostaRecuperaSenha: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Mensagem de confirmação do envio do email",
                example: "Email de recuperação enviado com sucesso."
            }
        },
        description: "Schema para resposta de recuperação de senha"
    },

    RequisicaoRedefinirSenha: {
        type: "object",
        properties: {
            email: {
                type: "string",
                format: "email",
                description: "Email do usuário",
                example: "admin@delivery.com"
            },
            codigo: {
                type: "string",
                description: "Código de recuperação recebido por email",
                example: "abc123def456"
            },
            novaSenha: {
                type: "string",
                description: "Nova senha (mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial)",
                example: "NovaSenha@456"
            }
        },
        required: ["email", "codigo", "novaSenha"],
        description: "Schema para redefinição de senha com código",
        example: {
            email: "joao.silva@email.com",
            codigo: "abc123def456",
            novaSenha: "NovaSenha@456"
        }
    },

    RespostaRedefinirSenha: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Mensagem de confirmação da redefinição",
                example: "Senha redefinida com sucesso."
            }
        },
        description: "Schema para resposta de redefinição de senha"
    },

    RespostaPass: {
        type: "object",
        properties: {
            active: {
                type: "boolean",
                description: "Indica se o token ainda é válido (não expirado)",
                example: true
            },
            token_type: {
                type: "string",
                description: "Tipo de token, conforme RFC 6749",
                example: "Bearer"
            },
            exp: {
                type: "integer",
                description: "Timestamp UNIX de expiração do token",
                example: 1672531199
            },
            iat: {
                type: "integer",
                description: "Timestamp UNIX de emissão do token",
                example: 1672527600
            }
        },
        description: "Schema para resposta de introspecção de token"
    }
};

export default authSchemas;
