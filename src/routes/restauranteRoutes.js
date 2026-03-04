// src/routes/restauranteRoutes.js

import express from 'express';
import RestauranteController from '../controllers/RestauranteController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
// import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const restauranteController = new RestauranteController();

router
    .get('/restaurantes', asyncWrapper(restauranteController.listar.bind(restauranteController)))
    .get('/restaurantes/:id', asyncWrapper(restauranteController.listar.bind(restauranteController)))
    .post('/restaurantes', /*AuthMiddleware,*/ asyncWrapper(restauranteController.criar.bind(restauranteController)))
    .patch('/restaurantes/:id', /*AuthMiddleware,*/ asyncWrapper(restauranteController.atualizar.bind(restauranteController)))
    .delete('/restaurantes/:id', /*AuthMiddleware,*/ asyncWrapper(restauranteController.deletar.bind(restauranteController)));

export default router;
