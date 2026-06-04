import mongoose from "mongoose";

class PedidoFilterBuild {
    constructor() {
        this.filtros = {};
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

    comStatus(status) {
        if (status) {
            this.filtros.status = {
                $regex: status,
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

export default PedidoFilterBuild;
