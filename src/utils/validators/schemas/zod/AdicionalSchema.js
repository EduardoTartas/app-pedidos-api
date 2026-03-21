// src/utils/validators/schemas/zod/AdicionalSchema.js

import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

const AdicionalGrupoSchema = z.object({
    prato_id: objectIdSchema,
    nome: z
        .string()
        .nonempty('Campo nome é obrigatório.')
        .min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    tipo: z
        .enum(['adicional', 'variacao'], {
            errorMap: () => ({ message: "Tipo deve ser 'adicional' ou 'variacao'." }),
        }),
    obrigatorio: z.boolean().optional(),
    min: z
        .number()
        .int()
        .min(0, 'Mínimo não pode ser negativo.')
        .optional(),
    max: z
        .number()
        .int()
        .positive('Máximo deve ser positivo.')
        .optional(),
    ativo: z.boolean().optional(),
});

const AdicionalGrupoUpdateSchema = AdicionalGrupoSchema.partial();

const AdicionalOpcaoSchema = z.object({
    grupo_id: objectIdSchema,
    nome: z
        .string()
        .nonempty('Campo nome é obrigatório.')
        .min(1, 'Nome não pode ser vazio.'),
    foto_adicional: z
        .string()
        .refine((val) => val === '' || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(val), {
            message: 'Deve ser um link de imagem com extensão válida.',
        })
        .optional(),
    preco: z
        .number()
        .min(0, 'O preço não pode ser negativo.'),
    ativo: z.boolean().optional(),
});

const AdicionalOpcaoUpdateSchema = AdicionalOpcaoSchema.partial();

export {
    AdicionalGrupoSchema,
    AdicionalGrupoUpdateSchema,
    AdicionalOpcaoSchema,
    AdicionalOpcaoUpdateSchema
};
