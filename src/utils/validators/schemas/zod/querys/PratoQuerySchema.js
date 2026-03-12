// src/utils/validators/schemas/zod/querys/PratoQuerySchema.js

import { z } from 'zod';
import mongoose from 'mongoose';

export const PratoQuerySchema = z.object({
    nome: z
        .string()
        .optional()
        .refine((val) => !val || val.trim().length > 0, {
            message: 'Nome não pode ser vazio.',
        })
        .transform((val) => val?.trim()),
    secao: z
        .string()
        .optional()
        .refine((val) => !val || val.trim().length > 0, {
            message: 'Seção não pode ser vazia.',
        })
        .transform((val) => val?.trim()),
    status: z
        .enum(['ativo', 'inativo'])
        .optional(),
    restaurante_id: z
        .string()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: 'Restaurante ID inválido.',
        })
        .optional(),
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => Number.isInteger(val) && val > 0, {
            message: 'Page deve ser um número inteiro maior que 0.',
        }),
    limite: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
            message: 'Limite deve ser um número inteiro entre 1 e 100.',
        }),
});
