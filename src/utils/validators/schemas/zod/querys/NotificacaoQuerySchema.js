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
        .optional()
});
