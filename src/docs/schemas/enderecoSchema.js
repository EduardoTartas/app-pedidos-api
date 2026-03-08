// src/docs/schemas/enderecoSchema.js

const enderecoSchemas = {
    EnderecoDetalhes: {
        type: "object",
        properties: {
            _id: { type: "string", example: "674fa21d79969d2172e78720" },
            usuario_id: { type: "string", example: "674fa21d79969d2172e78710", nullable: true },
            restaurante_id: { type: "string", example: null, nullable: true },
            label: { type: "string", example: "Casa" },
            cep: { type: "string", example: "76800000" },
            rua: { type: "string", example: "Rua das Flores" },
            numero: { type: "string", example: "123" },
            bairro: { type: "string", example: "Centro" },
            complemento: { type: "string", example: "Apt 101" },
            cidade: { type: "string", example: "Porto Velho" },
            estado: { type: "string", example: "RO" },
            principal: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" },
            updatedAt: { type: "string", format: "date-time", example: "16/01/2025 12:00:00" }
        },
        description: "Schema para detalhes de um endereço"
    },

    EnderecoListagem: {
        type: "array",
        items: { $ref: "#/components/schemas/EnderecoDetalhes" },
        description: "Lista de endereços"
    },

    EnderecoPost: {
        type: "object",
        properties: {
            label: { type: "string", description: "Rótulo do endereço (ex: Casa, Trabalho)", example: "Casa" },
            cep: { type: "string", description: "CEP do endereço", example: "76800000" },
            rua: { type: "string", description: "Rua/Logradouro", example: "Rua das Flores" },
            numero: { type: "string", description: "Número", example: "123" },
            bairro: { type: "string", description: "Bairro", example: "Centro" },
            complemento: { type: "string", description: "Complemento (opcional)", example: "Apt 101" },
            cidade: { type: "string", description: "Cidade", example: "Porto Velho" },
            estado: { type: "string", description: "Estado (UF)", example: "RO" },
            principal: { type: "boolean", description: "Endereço principal do usuário", example: true }
        },
        required: ["cep", "rua", "numero", "bairro", "cidade", "estado"],
        description: "Schema para criação de um endereço",
        example: {
            label: "Casa",
            cep: "76800000",
            rua: "Rua das Flores",
            numero: "123",
            bairro: "Centro",
            complemento: "Apt 101",
            cidade: "Porto Velho",
            estado: "RO",
            principal: true
        }
    },

    EnderecoPatch: {
        type: "object",
        properties: {
            label: { type: "string", example: "Trabalho" },
            cep: { type: "string", example: "76800001" },
            rua: { type: "string", example: "Rua Nova" },
            numero: { type: "string", example: "456" },
            bairro: { type: "string", example: "Jardim" },
            complemento: { type: "string", example: "Sala 02" },
            cidade: { type: "string", example: "Porto Velho" },
            estado: { type: "string", example: "RO" },
            principal: { type: "boolean", example: false }
        },
        required: [],
        description: "Schema para atualização parcial de um endereço",
        example: {
            rua: "Rua Nova",
            numero: "456",
            bairro: "Jardim"
        }
    },

    EnderecoRestaurantePost: {
        type: "object",
        properties: {
            label: { type: "string", description: "Rótulo do endereço", example: "Sede" },
            cep: { type: "string", description: "CEP do endereço", example: "76800000" },
            rua: { type: "string", description: "Rua/Logradouro", example: "Av. Principal" },
            numero: { type: "string", description: "Número", example: "500" },
            bairro: { type: "string", description: "Bairro", example: "Centro" },
            complemento: { type: "string", description: "Complemento (opcional)", example: "Loja 01" },
            cidade: { type: "string", description: "Cidade", example: "Porto Velho" },
            estado: { type: "string", description: "Estado (UF)", example: "RO" }
        },
        required: ["cep", "rua", "numero", "bairro", "cidade", "estado"],
        description: "Schema para criação do endereço de um restaurante (somente um permitido)",
        example: {
            label: "Sede",
            cep: "76800000",
            rua: "Av. Principal",
            numero: "500",
            bairro: "Centro",
            complemento: "Loja 01",
            cidade: "Porto Velho",
            estado: "RO"
        }
    }
};

export default enderecoSchemas;
