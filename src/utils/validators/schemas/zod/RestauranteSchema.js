// src/utils/validators/schemas/zod/RestauranteSchema.js

import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

const RestauranteSchema = z.object({
    nome: z
        .string()
        .nonempty('Campo nome é obrigatório.')
        .min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    foto_restaurante: z
        .string()
        .refine((val) => val === '' || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(val), {
            message: 'Deve ser um link de imagem com extensão válida.',
        })
        .optional(),
    status: z
        .enum(['aberto', 'fechado', 'inativo'], {
            errorMap: () => ({ message: "Status deve ser 'aberto', 'fechado' ou 'inativo'." }),
        })
        .optional(),
    endereco: z.object({
        logradouro: z.string().min(2, 'Logradouro é obrigatório.'),
        cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido.'),
        bairro: z.string().min(1, 'Bairro é obrigatório.'),
        numero: z.string().min(1, 'Número é obrigatório.'),
        complemento: z.string().optional(),
        cidade: z.string().min(2, 'Cidade é obrigatória.'),
        estado: z.string().length(2, 'Estado deve conter 2 caracteres (UF).'),
    }).optional(),
    categoria_ids: z
        .array(objectIdSchema)
        .min(1, 'Pelo menos uma categoria é obrigatória.')
        .optional(),
    secoes_cardapio: z
        .array(z.string().min(1, 'Nome da seção não pode ser vazio.'))
        .optional(),
    estimativa_entrega_min: z
        .number()
        .int()
        .positive('Estimativa mínima deve ser positiva.')
        .optional(),
    estimativa_entrega_max: z
        .number()
        .int()
        .positive('Estimativa máxima deve ser positiva.')
        .optional(),
    taxa_entrega: z
        .number()
        .min(0, 'Taxa de entrega não pode ser negativa.')
        .optional(),
});

const RestauranteUpdateSchema = RestauranteSchema.partial();

export { RestauranteSchema, RestauranteUpdateSchema };
