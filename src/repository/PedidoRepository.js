// src/repository/PedidoRepository.js

import Pedido from '../models/Pedido.js';
import PedidoFilterBuild from './filters/PedidoFilterBuild.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class PedidoRepository {
    constructor({ PedidoModel = Pedido } = {}) {
        this.modelPedido = PedidoModel;
    }

    async buscarPorID(id) {
        const pedido = await this.modelPedido.findById(id)
            .populate('cliente_id', 'nome email telefone')
            .populate('restaurante_id', 'nome foto_restaurante');
        if (!pedido) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Pedido',
                details: [],
                customMessage: messages.error.resourceNotFound('Pedido')
            });
        }
        return pedido;
    }

    async listarPorCliente(clienteId, req) {
        const { status, data_inicio, data_fim, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filterBuilder = new PedidoFilterBuild()
            .comCliente(clienteId)
            .comStatus(status || '')
            .comData(data_inicio, data_fim);

        const filtros = filterBuilder.build();

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            populate: [
                { path: 'restaurante_id', select: 'nome foto_restaurante' }
            ],
            sort: { createdAt: -1 },
        };

        const resultado = await this.modelPedido.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async listarPorRestaurante(restauranteId, req) {
        const { status, data_inicio, data_fim, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filterBuilder = new PedidoFilterBuild()
            .comRestaurante(restauranteId)
            .comStatus(status || '')
            .comData(data_inicio, data_fim);

        const filtros = filterBuilder.build();

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            populate: [
                { path: 'cliente_id', select: 'nome email telefone' }
            ],
            sort: { createdAt: -1 },
        };

        const resultado = await this.modelPedido.paginate(filtros, options);
        resultado.docs = resultado.docs.map(doc => {
            return typeof doc.toObject === 'function' ? doc.toObject() : doc;
        });
        return resultado;
    }

    async criar(dadosPedido) {
        const pedido = new this.modelPedido(dadosPedido);
        return await pedido.save();
    }

    async atualizar(id, parsedData) {
        const pedido = await this.modelPedido.findByIdAndUpdate(id, parsedData, { returnDocument: 'after' })
            .populate('cliente_id', 'nome email telefone')
            .populate('restaurante_id', 'nome foto_restaurante');
        if (!pedido) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Pedido',
                details: [],
                customMessage: messages.error.resourceNotFound('Pedido')
            });
        }
        return pedido;
    }
}

export default PedidoRepository;
