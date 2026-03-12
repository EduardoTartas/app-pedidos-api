// src/routes/pratoRoutes.js

import express from 'express';
import PratoController from '../controllers/PratoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const pratoController = new PratoController();

router
    .get('/pratos', AuthMiddleware, asyncWrapper(pratoController.listar.bind(pratoController)))
    .get('/pratos/:id', asyncWrapper(pratoController.listar.bind(pratoController)))
    .get('/cardapio/:restauranteId', asyncWrapper(pratoController.buscarCardapio.bind(pratoController)))
    .post('/pratos', AuthMiddleware, asyncWrapper(pratoController.criar.bind(pratoController)))
    .patch('/pratos/:id', AuthMiddleware, asyncWrapper(pratoController.atualizar.bind(pratoController)))
    .delete('/pratos/:id', AuthMiddleware, asyncWrapper(pratoController.deletar.bind(pratoController)));

export default router;
