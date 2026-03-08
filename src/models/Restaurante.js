// src/models/Restaurante.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class Restaurante {
    constructor() {
        const restauranteSchema = new mongoose.Schema({
            nome: {
                type: String,
                required: [true, "O nome do restaurante é obrigatório!"],
                trim: true
            },
            foto_restaurante: {
                type: String,
                default: ""
            },
            dono_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuarios",
                required: [true, "O dono do restaurante é obrigatório!"]
            },
            status: {
                type: String,
                enum: ["aberto", "fechado", "inativo"],
                default: "fechado"
            },
            categoria_ids: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "categorias"
            }],
            secoes_cardapio: [{
                type: String,
                trim: true
            }],
            estimativa_entrega_min: {
                type: Number,
                default: 30
            },
            estimativa_entrega_max: {
                type: Number,
                default: 50
            },
            avaliacao_media: {
                type: Number,
                default: 0
            },
            taxa_entrega: {
                type: Number,
                default: 0
            },
            cnpj: {
                type: String,
                unique: true,
                sparse: true
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        restauranteSchema.plugin(mongoosePaginate);
        restauranteSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.restaurantes || mongoose.model("restaurantes", restauranteSchema);
    }
}

export default new Restaurante().model;
