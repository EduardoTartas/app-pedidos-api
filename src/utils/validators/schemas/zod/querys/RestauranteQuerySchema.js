// src/utils/validators/schemas/zod/querys/RestauranteQuerySchema.js

import { z } from 'zod';
import mongoose from 'mongoose';

export const RestauranteIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'ID inválido.',
});

export const RestauranteQuerySchema = z.object({
    nome: z
        .string()
        .optional()
        .refine((val) => !val || val.trim().length > 0, {
            message: 'Nome não pode ser vazio.',
        })
        .transform((val) => val?.trim()),
    status: z
        .enum(['aberto', 'fechado', 'inativo'])
        .optional(),
    categoria: z
        .string()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: 'Categoria inválida.',
        })
        .optional(),
    dono_id: z
        .string()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: 'dono_id inválido.',
        })
        .optional(),
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

    // ═══════════════════════════════════════════
    // NOVOS FILTROS PARA TELA DE RESTAURANTES
    // ═══════════════════════════════════════════

    // Ordenação: campo pelo qual ordenar os resultados
    ordenar: z
        .enum(['nome', 'avaliacao_media', 'taxa_entrega', 'estimativa_entrega_min'])
        .optional(),

    // Direção da ordenação: ascendente ou descendente
    ordem: z
        .enum(['asc', 'desc'])
        .optional()
        .transform((val) => val || 'asc'),

    // Filtro booleano: somente restaurantes com entrega grátis (taxa_entrega = 0)
    entrega_gratis: z
        .enum(['true', 'false'])
        .optional()
        .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),

    // Filtro numérico: avaliação mínima (ex: 4.0)
    avaliacao_min: z
        .string()
        .optional()
        .transform((val) => val ? parseFloat(val) : undefined)
        .refine((val) => val === undefined || (val >= 0 && val <= 5), {
            message: 'Avaliação mínima deve ser entre 0 e 5.',
        }),
});
