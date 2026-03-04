// src/utils/validators/schemas/zod/PedidoSchema.js

import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

const ItemAdicionalSchema = z.object({
    opcao_id: objectIdSchema,
    quantidade: z.number().int().positive('Quantidade deve ser positiva.').optional().default(1),
});

const ItemPedidoSchema = z.object({
    prato_id: objectIdSchema,
    quantidade: z.number().int().positive('Quantidade deve ser positiva.'),
    adicionais: z.array(ItemAdicionalSchema).optional().default([]),
});

const PedidoSchema = z.object({
    restaurante_id: objectIdSchema,
    itens: z
        .array(ItemPedidoSchema)
        .min(1, 'O pedido deve conter pelo menos 1 item.'),
});

const PedidoStatusSchema = z.object({
    status: z.enum(['em_preparo', 'a_caminho', 'entregue', 'cancelado'], {
        errorMap: () => ({ message: "Status deve ser 'em_preparo', 'a_caminho', 'entregue' ou 'cancelado'." }),
    }),
});

export { PedidoSchema, PedidoStatusSchema };
