// src/utils/validators/schemas/zod/UsuarioSchema.js

import { z } from 'zod';

const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const cpfRegex = /^\d{11}$/;
const telefoneRegex = /^\d{10,11}$/;

const UsuarioSchema = z.object({
    nome: z
        .string()
        .nonempty('Campo nome é obrigatório.')
        .min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    email: z
        .string()
        .email('Formato de email inválido.')
        .nonempty('Campo email é obrigatório.'),
    senha: z
        .string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres.')
        .refine((senha) => {
            if (!senha) return true;
            return senhaRegex.test(senha);
        }, {
            message: 'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.',
        })
        .optional(),
    cpf: z
        .string()
        .nonempty('Campo CPF é obrigatório.')
        .refine((val) => cpfRegex.test(val), {
            message: 'CPF deve conter exatamente 11 dígitos numéricos.',
        })
        .optional(),
    telefone: z
        .string()
        .nonempty('Campo telefone é obrigatório.')
        .refine((val) => telefoneRegex.test(val), {
            message: 'Telefone deve conter 10 ou 11 dígitos numéricos.',
        })
        .optional(),
    foto_perfil: z
        .string()
        .refine((val) => val === '' || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(val), {
            message: 'Deve ser um link de imagem com extensão válida (jpg, png, etc).',
        })
        .optional(),
    isAdmin: z.boolean().optional(),
});

const UsuarioUpdateSchema = UsuarioSchema.partial();

const UsuarioStatusUpdateSchema = z.object({
    status: z.enum(['ativo', 'inativo'], {
        errorMap: () => ({ message: "O status deve ser 'ativo' ou 'inativo'." })
    })
});

export { UsuarioSchema, UsuarioUpdateSchema, UsuarioStatusUpdateSchema };
