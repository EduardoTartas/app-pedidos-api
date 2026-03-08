// src/utils/validators/schemas/zod/EnderecoSchema.js

import { z } from 'zod';

const EnderecoSchema = z.object({
    label: z
        .string()
        .max(50, 'Label deve ter no máximo 50 caracteres.')
        .optional(),
    cep: z
        .string()
        .regex(/^\d{5}-?\d{3}$/, 'CEP inválido.'),
    rua: z
        .string()
        .min(2, 'Rua deve ter pelo menos 2 caracteres.'),
    numero: z
        .string()
        .min(1, 'Número é obrigatório.'),
    bairro: z
        .string()
        .min(1, 'Bairro é obrigatório.'),
    complemento: z
        .string()
        .optional(),
    cidade: z
        .string()
        .min(2, 'Cidade é obrigatória.'),
    estado: z
        .string()
        .length(2, 'Estado deve conter 2 caracteres (UF).'),
    principal: z
        .boolean()
        .optional(),
});

const EnderecoUpdateSchema = EnderecoSchema.partial();

export { EnderecoSchema, EnderecoUpdateSchema };
