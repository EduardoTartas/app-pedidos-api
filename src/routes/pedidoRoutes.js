// src/routes/pedidoRoutes.js

import express from 'express';
import PedidoController from '../controllers/PedidoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const pedidoController = new PedidoController();

router
    .get('/pedidos/meus', AuthMiddleware, asyncWrapper(pedidoController.listarMeusPedidos.bind(pedidoController)))
    .get('/pedidos/restaurante/:restauranteId', AuthMiddleware, asyncWrapper(pedidoController.listarPedidosRestaurante.bind(pedidoController)))
    .post('/pedidos', AuthMiddleware, asyncWrapper(pedidoController.criar.bind(pedidoController)))
    .patch('/pedidos/:id/status', AuthMiddleware, asyncWrapper(pedidoController.atualizarStatus.bind(pedidoController)));

export default router;
