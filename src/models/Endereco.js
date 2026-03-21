// src/models/Endereco.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class Endereco {
    constructor() {
        const enderecoSchema = new mongoose.Schema({
            usuario_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuarios",
                default: null
            },
            restaurante_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "restaurantes",
                default: null
            },
            label: {
                type: String,
                trim: true,
                default: ""
            },
            cep: {
                type: String,
                required: [true, "O CEP é obrigatório!"]
            },
            rua: {
                type: String,
                required: [true, "A rua é obrigatória!"]
            },
            numero: {
                type: String,
                required: [true, "O número é obrigatório!"]
            },
            bairro: {
                type: String,
                required: [true, "O bairro é obrigatório!"]
            },
            complemento: {
                type: String,
                default: ""
            },
            cidade: {
                type: String,
                required: [true, "A cidade é obrigatória!"]
            },
            estado: {
                type: String,
                required: [true, "O estado é obrigatório!"]
            },
            principal: {
                type: Boolean,
                default: false
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        // Um restaurante só pode ter um endereço
        enderecoSchema.index({ restaurante_id: 1 }, {
            unique: true,
            partialFilterExpression: { restaurante_id: { $ne: null } }
        });

        enderecoSchema.plugin(mongoosePaginate);
        enderecoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.enderecos || mongoose.model("enderecos", enderecoSchema);
    }
}

export default new Endereco().model;
