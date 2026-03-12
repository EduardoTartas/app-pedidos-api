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
    adicionais: [adicionalItemSchema]
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
