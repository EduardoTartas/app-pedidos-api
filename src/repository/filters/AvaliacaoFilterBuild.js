import mongoose from "mongoose";

class AvaliacaoFilterBuild {
    constructor() {
        this.filtros = {};
    }

    comPedido(pedidoId) {
        if (pedidoId) {
            this.filtros.pedido_id = mongoose.Types.ObjectId.isValid(pedidoId)
                ? new mongoose.Types.ObjectId(pedidoId)
                : pedidoId;
        }
        return this;
    }

    comCliente(clienteId) {
        if (clienteId) {
            this.filtros.cliente_id = mongoose.Types.ObjectId.isValid(clienteId)
                ? new mongoose.Types.ObjectId(clienteId)
                : clienteId;
        }
        return this;
    }

    comRestaurante(restauranteId) {
        if (restauranteId) {
            this.filtros.restaurante_id = mongoose.Types.ObjectId.isValid(restauranteId)
                ? new mongoose.Types.ObjectId(restauranteId)
                : restauranteId;
        }
        return this;
    }

    comNota(minNota, maxNota) {
        if (minNota !== undefined || maxNota !== undefined) {
            this.filtros.nota = {};

            if (minNota !== undefined && notNaN(minNota)) {
                const nota = Number(minNota);
                // Valida conforme regra de negócio (1-5)
                if (nota >= 1 && nota <= 5) {
                    this.filtros.nota.$gte = nota;
                }
            }

            if (maxNota !== undefined && notNaN(maxNota)) {
                const nota = Number(maxNota);
                // Valida conforme regra de negócio (1-5)
                if (nota >= 1 && nota <= 5) {
                    this.filtros.nota.$lte = nota;
                }
            }

            if (Object.keys(this.filtros.nota).length === 0) {
                delete this.filtros.nota;
            }
        }
        return this;
    }

    comDescricao(descricao) {
        if (descricao) {
            this.filtros.descricao = {
                $regex: descricao,
                $options: "i"
            };
        }
        return this;
    }

    comData(inicio, fim) {
        if (inicio || fim) {
            this.filtros.createdAt = {};

            if (inicio) {
                const [ano, mes, dia] = inicio.split("-").map(Number);
                const dataInicio = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
                this.filtros.createdAt.$gte = dataInicio;
            }

            if (fim) {
                const [ano, mes, dia] = fim.split("-").map(Number);
                const dataFim = new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));
                this.filtros.createdAt.$lte = dataFim;
            }
        }
        return this;
    }

    build() {
        return this.filtros;
    }
}

function notNaN(val) {
    return val !== '' && !isNaN(Number(val));
}

export default AvaliacaoFilterBuild;
