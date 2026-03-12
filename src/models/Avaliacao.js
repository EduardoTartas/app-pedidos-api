// src/models/Avaliacao.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class Avaliacao {
    constructor() {
        const avaliacaoSchema = new mongoose.Schema({
            pedido_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "pedidos",
                required: [true, "O pedido é obrigatório!"],
                unique: true
            },
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
            nota: {
                type: Number,
                required: [true, "A nota é obrigatória!"],
                min: [1, "A nota mínima é 1!"],
                max: [5, "A nota máxima é 5!"]
            },
            descricao: {
                type: String,
                default: ""
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        avaliacaoSchema.plugin(mongoosePaginate);
        avaliacaoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.avaliacoes || mongoose.model("avaliacoes", avaliacaoSchema);
    }
}

export default new Avaliacao().model;
