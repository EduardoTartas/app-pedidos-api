// src/models/Categoria.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class Categoria {
    constructor() {
        const categoriaSchema = new mongoose.Schema({
            nome: {
                type: String,
                required: [true, "O nome da categoria é obrigatório!"],
                unique: true,
                trim: true
            },
            img: {
                type: String,
                default: ""
            },
            ativo: {
                type: Boolean,
                default: true
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        categoriaSchema.plugin(mongoosePaginate);
        categoriaSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.categorias || mongoose.model("categorias", categoriaSchema);
    }
}

export default new Categoria().model;
