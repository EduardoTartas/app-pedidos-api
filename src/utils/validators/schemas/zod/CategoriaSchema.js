// src/utils/validators/schemas/zod/CategoriaSchema.js

import { z } from 'zod';

const CategoriaSchema = z.object({
    nome: z
        .string()
        .nonempty('Campo nome é obrigatório.')
        .min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    icone_categoria: z
        .string()
        .refine((val) => val === '' || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(val), {
            message: 'Deve ser um link de imagem com extensão válida.',
        })
        .optional(),
    ativo: z.boolean().optional(),
});

const CategoriaUpdateSchema = CategoriaSchema.partial();

export { CategoriaSchema, CategoriaUpdateSchema };
