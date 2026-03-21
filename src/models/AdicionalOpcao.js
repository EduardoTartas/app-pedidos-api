// src/models/AdicionalOpcao.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class AdicionalOpcao {
    constructor() {
        const adicionalOpcaoSchema = new mongoose.Schema({
            grupo_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "adicionais_grupos",
                required: [true, "O grupo de adicionais é obrigatório!"]
            },
            nome: {
                type: String,
                required: [true, "O nome da opção é obrigatório!"],
                trim: true
            },
            foto_adicional: {
                type: String,
                default: ""
            },
            preco: {
                type: Number,
                default: 0,
                min: [0, "O preço não pode ser negativo!"]
            },
            ativo: {
                type: Boolean,
                default: true
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        adicionalOpcaoSchema.plugin(mongoosePaginate);
        adicionalOpcaoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.adicionais_opcoes || mongoose.model("adicionais_opcoes", adicionalOpcaoSchema);
    }
}

export default new AdicionalOpcao().model;
