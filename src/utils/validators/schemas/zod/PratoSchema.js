// src/utils/validators/schemas/zod/PratoSchema.js

import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

const PratoSchema = z.object({
    restaurante_id: objectIdSchema,
    nome: z
        .string()
        .nonempty('Campo nome é obrigatório.')
        .min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    foto_prato: z
        .string()
        .refine((val) => val === '' || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(val), {
            message: 'Deve ser um link de imagem com extensão válida.',
        })
        .optional(),
    preco: z
        .number()
        .positive('O preço deve ser maior que zero.'),
    descricao: z
        .string()
        .optional(),
    secao: z
        .string()
        .nonempty('Campo seção é obrigatório.')
        .min(1, 'Seção não pode ser vazia.'),
    status: z
        .enum(['ativo', 'inativo'], {
            errorMap: () => ({ message: "Status deve ser 'ativo' ou 'inativo'." }),
        })
        .optional(),
    adicionais_grupo_ids: z
        .array(objectIdSchema)
        .optional(),
});

const PratoUpdateSchema = PratoSchema.partial();

export { PratoSchema, PratoUpdateSchema };
