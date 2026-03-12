// src/models/AdicionalGrupo.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class AdicionalGrupo {
    constructor() {
        const adicionalGrupoSchema = new mongoose.Schema({
            restaurante_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "restaurantes",
                required: [true, "O restaurante é obrigatório!"]
            },
            nome: {
                type: String,
                required: [true, "O nome do grupo de adicionais é obrigatório!"],
                trim: true
            },
            tipo: {
                type: String,
                enum: ["adicional", "variacao"],
                default: "adicional"
            },
            obrigatorio: {
                type: Boolean,
                default: false
            },
            min: {
                type: Number,
                default: 0,
                min: [0, "O mínimo não pode ser negativo!"]
            },
            max: {
                type: Number,
                default: 3,
                min: [1, "O máximo deve ser pelo menos 1!"]
            },
            ativo: {
                type: Boolean,
                default: true
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        adicionalGrupoSchema.plugin(mongoosePaginate);
        adicionalGrupoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.adicionais_grupos || mongoose.model("adicionais_grupos", adicionalGrupoSchema);
    }
}

export default new AdicionalGrupo().model;
