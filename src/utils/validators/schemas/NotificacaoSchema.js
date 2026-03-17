import { z } from 'zod';
import objectIdSchema from './zod/ObjectIdSchema.js';

const NotificacaoSchema = z.object({
    usuario_id: objectIdSchema,
    pedido_id: objectIdSchema.nullable().optional(),
    tipo: z
        .enum([
            'pedido_confirmado',
            'em_preparo',
            'a_caminho',
            'entregue',
            'cancelado',
            'avaliacao',
            'geral'
        ], {
            errorMap: () => ({
                message: "Tipo deve ser um dos seguintes: 'pedido_confirmado', 'em_preparo', 'a_caminho', 'entregue', 'cancelado', 'avaliacao', 'geral'."
            })
        }),

});

const NotificacaoUpdateSchema = NotificacaoSchema.partial();

export { NotificacaoSchema, NotificacaoUpdateSchema };
