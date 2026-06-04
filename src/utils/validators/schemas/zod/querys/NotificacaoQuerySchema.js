import { z } from 'zod';
import mongoose from 'mongoose';

export const NotificacaoIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'ID inválido.',
});

export const NotificacaoQuerySchema = z.object({
    usuario_id: z
        .string()
        .refine((id) => mongoose.Types.ObjectId.isValid(id), {
            message: 'ID do usuário inválido.',
        })
        .optional(),
    pedido_id: z
        .string()
        .refine((id) => mongoose.Types.ObjectId.isValid(id), {
            message: 'ID do pedido inválido.',
        })
        .optional(),
    tipo: z
        .enum([
            'pedido_confirmado',
            'em_preparo',
            'a_caminho',
            'entregue',
            'cancelado',
            'avaliacao',
            'geral'
        ])
        .optional(),
    lida: z
        .preprocess(
            (val) => {
                if (val === 'true' || val === true) return true;
                if (val === 'false' || val === false) return false;
                return undefined;
            },
            z.boolean().optional()
        ),
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
