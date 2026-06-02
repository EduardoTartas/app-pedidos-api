// src/models/Pedido.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

const adicionalItemSchema = new mongoose.Schema({
    opcao_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adicionais_opcoes",
        required: true
    },
    opcao_nome: {
        type: String,
        required: true
    },
    preco_unitario: {
        type: Number,
        required: true,
        min: 0
    },
    quantidade: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { _id: false });

const itemPedidoSchema = new mongoose.Schema({
    prato_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "pratos",
        required: true
    },
    prato_nome: {
        type: String,
        required: true
    },
    preco_unitario: {
        type: Number,
        required: true,
        min: 0
    },
    quantidade: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    observacao: {
        type: String,
        trim: true,
        default: ""
    },
    adicionais: [adicionalItemSchema]
}, { _id: false });

/**
 * Snapshot do endereço de entrega no momento do pedido.
 * Armazenado como objeto embutido (não referência) para preservar dados históricos
 * mesmo que o usuário altere ou remova o endereço posteriormente.
 */
const enderecoEntregaSchema = new mongoose.Schema({
    logradouro: { type: String, required: true },
    numero:     { type: String, required: true },
    bairro:     { type: String, required: true },
    cidade:     { type: String, required: true },
    estado:     { type: String, required: true },
    cep:        { type: String, required: true },
    complemento:{ type: String, default: '' },
    label:      { type: String, default: '' }
}, { _id: false });

class Pedido {
    constructor() {
        const pedidoSchema = new mongoose.Schema({
            cliente_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuarios",
                required: [true, "O cliente é obrigatório!"]
            },
            restaurante_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "restaurantes",
                required: [true, "O restaurante é obrigatório!"]
            },
            status: {
                type: String,
                enum: ["criado", "em_preparo", "a_caminho", "entregue", "cancelado"],
                default: "criado"
            },
            itens: {
                type: [itemPedidoSchema],
                required: [true, "Os itens do pedido são obrigatórios!"],
                validate: {
                    validator: function (v) {
                        return v && v.length > 0;
                    },
                    message: "O pedido deve ter pelo menos um item!"
                }
            },
            totais: {
                subtotal: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0
                },
                taxa_entrega: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0
                },
                total: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0
                }
            },
            // Endereço de entrega obrigatório no pedido
            endereco_entrega: {
                type: enderecoEntregaSchema,
                required: [true, "O endereço de entrega é obrigatório!"]
            },
            forma_pagamento: {
                type: String,
                enum: ["dinheiro", "cartao_credito", "cartao_debito", "pix"],
                default: "pix"
            },
            avaliacao_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "avaliacoes",
                default: null
            },
            historico_status: [{
                status: { type: String },
                data: { type: Date, default: Date.now }
            }]
        }, {
            timestamps: true,
            versionKey: false
        });

        pedidoSchema.plugin(mongoosePaginate);
        pedidoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.pedidos || mongoose.model("pedidos", pedidoSchema);
    }
}

export default new Pedido().model;
