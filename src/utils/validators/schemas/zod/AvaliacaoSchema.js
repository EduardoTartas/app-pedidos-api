// src/utils/validators/schemas/zod/AvaliacaoSchema.js

import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

const AvaliacaoSchema = z.object({
    pedido_id: objectIdSchema,
    nota: z
        .number()
        .int()
        .min(1, 'A nota deve ser no mínimo 1.')
        .max(5, 'A nota deve ser no máximo 5.'),
    descricao: z
        .string()
        .max(500, 'A descrição deve ter no máximo 500 caracteres.')
        .optional(),
});

export { AvaliacaoSchema };
