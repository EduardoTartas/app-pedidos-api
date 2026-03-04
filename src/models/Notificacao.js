// src/models/Notificacao.js

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import brazilianDatePlugin from "../utils/helpers/mongooseBrazilianDatePlugin.js";

class Notificacao {
    constructor() {
        const notificacaoSchema = new mongoose.Schema({
            usuario_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuarios",
                required: [true, "O usuário é obrigatório!"]
            },
            pedido_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "pedidos",
                default: null
            },
            tipo: {
                type: String,
                enum: ["pedido_confirmado", "em_preparo", "a_caminho", "entregue", "cancelado", "avaliacao", "geral"],
                required: [true, "O tipo de notificação é obrigatório!"]
            },
            titulo: {
                type: String,
                required: [true, "O título é obrigatório!"]
            },
            mensagem: {
                type: String,
                required: [true, "A mensagem é obrigatória!"]
            },
            lida: {
                type: Boolean,
                default: false
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        notificacaoSchema.plugin(mongoosePaginate);
        notificacaoSchema.plugin(brazilianDatePlugin);

        this.model =
            mongoose.models.notificacoes || mongoose.model("notificacoes", notificacaoSchema);
    }
}

export default new Notificacao().model;
