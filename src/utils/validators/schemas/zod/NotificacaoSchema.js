import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

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
        titulo: z
        .string()
        .nonempty('Campo título é obrigatório.')
        .min(2, 'Título deve ter pelo menos 2 caracteres.'),
    mensagem: z
        .string()
        .nonempty('Campo mensagem é obrigatório.')
        .min(5, 'Mensagem deve ter pelo menos 5 caracteres.'),
    lida_em: z
        .string()
        .datetime({ message: 'Data inválida.' })
        .nullable()
        .optional(),

});

const NotificacaoUpdateSchema = NotificacaoSchema.partial();

export { NotificacaoSchema, NotificacaoUpdateSchema };
