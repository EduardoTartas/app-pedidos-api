// src/utils/validators/schemas/zod/querys/PedidoQuerySchema.js

import { z } from 'zod';

export const PedidoQuerySchema = z.object({
    status: z
        .enum(['criado', 'em_preparo', 'a_caminho', 'entregue', 'cancelado'])
        .optional(),
    data_inicio: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use AAAA-MM-DD.')
        .optional(),
    data_fim: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use AAAA-MM-DD.')
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
