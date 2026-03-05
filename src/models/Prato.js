// src/models/Prato.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class Prato {
    constructor() {
        const pratoSchema = new mongoose.Schema({
            restaurante_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "restaurantes",
                required: [true, "O restaurante é obrigatório!"]
            },
            nome: {
                type: String,
                required: [true, "O nome do prato é obrigatório!"],
                trim: true
            },
            foto_prato: {
                type: String,
                default: ""
            },
            preco: {
                type: Number,
                required: [true, "O preço é obrigatório!"],
                min: [0, "O preço não pode ser negativo!"]
            },
            descricao: {
                type: String,
                default: ""
            },
            secao: {
                type: String,
                trim: true,
                default: ""
            },
            status: {
                type: String,
                enum: ["ativo", "inativo"],
                default: "ativo"
            },
            adicionais_grupo_ids: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "adicionais_grupos"
            }]
        }, {
            timestamps: true,
            versionKey: false
        });

        pratoSchema.plugin(mongoosePaginate);
        pratoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.pratos || mongoose.model("pratos", pratoSchema);
    }
}

export default new Prato().model;
