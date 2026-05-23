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

/**
 * MELHORIA-05: Endereço de entrega obrigatório no payload do pedido.
 * Armazenado como snapshot — não como referência — para preservar histórico.
 */
const EnderecoEntregaSchema = z.object({
    logradouro:  z.string().min(1, 'Logradouro é obrigatório.'),
    numero:      z.string().min(1, 'Número é obrigatório.'),
    bairro:      z.string().min(1, 'Bairro é obrigatório.'),
    cidade:      z.string().min(1, 'Cidade é obrigatória.'),
    estado:      z.string().length(2, 'Estado deve ser a sigla com 2 caracteres (ex: SP).'),
    cep:         z.string().regex(/^\d{8}$/, 'CEP deve conter 8 dígitos numéricos sem traço.'),
    complemento: z.string().optional().default(''),
    label:       z.string().optional().default(''),
});

const PedidoSchema = z.object({
    restaurante_id: objectIdSchema,
    itens: z
        .array(ItemPedidoSchema)
        .min(1, 'O pedido deve conter pelo menos 1 item.'),
    endereco_entrega: EnderecoEntregaSchema,
    forma_pagamento: z.enum(
        ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'],
        { errorMap: () => ({ message: "Forma de pagamento inválida." }) }
    ).optional().default('pix'),
});

const PedidoStatusSchema = z.object({
    status: z.enum(['em_preparo', 'a_caminho', 'entregue', 'cancelado'], {
        errorMap: () => ({ message: "Status deve ser 'em_preparo', 'a_caminho', 'entregue' ou 'cancelado'." }),
    }),
});

export { PedidoSchema, PedidoStatusSchema, EnderecoEntregaSchema };
