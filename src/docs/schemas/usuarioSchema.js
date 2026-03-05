// src/docs/schemas/usuarioSchema.js

const usuarioSchemas = {
    UsuarioFiltro: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Filtra por nome", example: "João" },
            email: { type: "string", format: "email", description: "Filtra por email", example: "joao@email.com" },
            status: { type: "string", enum: ["ativo", "inativo"], description: "Filtra por status", example: "ativo" }
        }
    },

    UsuarioListagem: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "João da Silva" },
            email: { type: "string", format: "email", example: "joao.silva@email.com" },
            cpf_cnpj: { type: "string", example: "12345678900" },
            telefone: { type: "string", example: "69999998888" },
            status: { type: "string", enum: ["ativo", "inativo"], example: "ativo" },
            isAdmin: { type: "boolean", example: false },
            foto_perfil: { type: "string", example: "" },
            endereco: {
                type: "object",
                properties: {
                    cep: { type: "string", example: "76800000" },
                    rua: { type: "string", example: "Rua das Flores" },
                    numero: { type: "string", example: "123" },
                    bairro: { type: "string", example: "Centro" },
                    complemento: { type: "string", example: "Apt 101" }
                }
            },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para listagem de usuários"
    },

    UsuarioDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78710" },
            nome: { type: "string", example: "João da Silva" },
            email: { type: "string", format: "email", example: "joao.silva@email.com" },
            cpf_cnpj: { type: "string", example: "12345678900" },
            telefone: { type: "string", example: "69999998888" },
            status: { type: "string", enum: ["ativo", "inativo"], example: "ativo" },
            isAdmin: { type: "boolean", example: false },
            foto_perfil: { type: "string", example: "" },
            endereco: {
                type: "object",
                properties: {
                    cep: { type: "string", example: "76800000" },
                    rua: { type: "string", example: "Rua das Flores" },
                    numero: { type: "string", example: "123" },
                    bairro: { type: "string", example: "Centro" },
                    complemento: { type: "string", example: "Apt 101" }
                }
            },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de um usuário"
    },

    UsuarioPost: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome completo", example: "João da Silva" },
            email: { type: "string", format: "email", description: "Email do usuário", example: "joao.silva@email.com" },
            senha: { type: "string", description: "Senha segura", example: "Senha@123" },
            cpf_cnpj: { type: "string", description: "CPF ou CNPJ", example: "12345678900" },
            telefone: { type: "string", description: "Telefone de contato", example: "69999998888" },
            isAdmin: { type: "boolean", description: "Define se é administrador", example: false },
            endereco: {
                type: "object",
                properties: {
                    cep: { type: "string", example: "76800000" },
                    rua: { type: "string", example: "Rua das Flores" },
                    numero: { type: "string", example: "123" },
                    bairro: { type: "string", example: "Centro" },
                    complemento: { type: "string", example: "Apt 101" }
                }
            }
        },
        required: ["nome", "email", "senha"],
        description: "Schema para criação de um usuário",
        example: {
            nome: "João da Silva",
            email: "joao.silva@email.com",
            senha: "Senha@123",
            cpf_cnpj: "12345678900",
            telefone: "69999998888",
            isAdmin: false,
            endereco: {
                cep: "76800000",
                rua: "Rua das Flores",
                numero: "123",
                bairro: "Centro",
                complemento: "Apt 101"
            }
        }
    },

    UsuarioPatch: {
        type: "object",
        properties: {
            nome: { type: "string", description: "Nome completo", example: "João da Silva Pereira" },
            telefone: { type: "string", description: "Telefone de contato", example: "69999997777" },
            foto_perfil: { type: "string", description: "URL da foto de perfil", example: "https://example.com/foto.jpg" },
            endereco: {
                type: "object",
                properties: {
                    cep: { type: "string", example: "76800001" },
                    rua: { type: "string", example: "Rua Nova" },
                    numero: { type: "string", example: "456" },
                    bairro: { type: "string", example: "Jardim" },
                    complemento: { type: "string", example: "Casa" }
                }
            }
        },
        required: [],
        description: "Schema para atualização parcial de um usuário",
        example: {
            nome: "João da Silva Pereira",
            telefone: "69999997777",
            endereco: {
                rua: "Rua Nova",
                numero: "456",
                bairro: "Jardim"
            }
        }
    },

    UsuarioStatusPatch: {
        type: "object",
        properties: {
            status: {
                type: "string",
                enum: ["ativo", "inativo"],
                description: "Novo status do usuário",
                example: "inativo"
            }
        },
        required: ["status"],
        description: "Schema para atualização de status do usuário",
        example: {
            status: "inativo"
        }
    }
};

export default usuarioSchemas;
