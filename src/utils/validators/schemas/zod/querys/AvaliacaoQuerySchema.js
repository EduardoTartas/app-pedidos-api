import { z } from 'zod';
import mongoose from 'mongoose';

export const AvaliacaoQuerySchema = z.object({
    pedido_id: z
        .string()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: 'Pedido ID inválido.',
        })
        .optional(),
    cliente_id: z
        .string()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: 'Cliente ID inválido.',
        })
        .optional(),
    restaurante_id: z
        .string()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: 'Restaurante ID inválido.',
        })
        .optional(),
    nota_min: z
        .string()
        .refine((val) => !val || !isNaN(parseFloat(val)), { 
            message: 'Nota mínima deve ser um número.' 
        })
        .transform((val) => val ? parseFloat(val) : undefined)
        .refine((val) => val === undefined || (val >= 1 && val <= 5), {
            message: 'Nota mínima deve estar entre 1 e 5.',
        })
        .optional(),
    nota_max: z
        .string()
        .refine((val) => !val || !isNaN(parseFloat(val)), { 
            message: 'Nota máxima deve ser um número.' 
        })
        .transform((val) => val ? parseFloat(val) : undefined)
        .refine((val) => val === undefined || (val >= 1 && val <= 5), {
            message: 'Nota máxima deve estar entre 1 e 5.',
        })
        .optional(),
    descricao: z
        .string()
        .optional()
        .refine((val) => !val || val.trim().length > 0, {
            message: 'Descrição não pode ser vazia.',
        })
        .transform((val) => val?.trim()),
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
