// src/routes/enderecoRoutes.js

import express from 'express';
import EnderecoController from '../controllers/EnderecoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
// import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const enderecoController = new EnderecoController();

// Rotas de endereço de usuário (um usuário pode ter múltiplos endereços)
router
    .get('/usuarios/:usuarioId/enderecos', /*AuthMiddleware,*/ asyncWrapper(enderecoController.listarPorUsuario.bind(enderecoController)))
    .post('/usuarios/:usuarioId/enderecos', /*AuthMiddleware,*/ asyncWrapper(enderecoController.criarParaUsuario.bind(enderecoController)))
    .patch('/usuarios/:usuarioId/enderecos/:enderecoId', /*AuthMiddleware,*/ asyncWrapper(enderecoController.atualizarDeUsuario.bind(enderecoController)))
    .delete('/usuarios/:usuarioId/enderecos/:enderecoId', /*AuthMiddleware,*/ asyncWrapper(enderecoController.deletarDeUsuario.bind(enderecoController)));

// Rotas de endereço de restaurante (um restaurante pode ter somente um endereço)
router
    .get('/restaurantes/:restauranteId/enderecos', asyncWrapper(enderecoController.buscarPorRestaurante.bind(enderecoController)))
    .post('/restaurantes/:restauranteId/enderecos', /*AuthMiddleware,*/ asyncWrapper(enderecoController.criarParaRestaurante.bind(enderecoController)))
    .patch('/restaurantes/:restauranteId/enderecos/:enderecoId', /*AuthMiddleware,*/ asyncWrapper(enderecoController.atualizarDeRestaurante.bind(enderecoController)))
    .delete('/restaurantes/:restauranteId/enderecos/:enderecoId', /*AuthMiddleware,*/ asyncWrapper(enderecoController.deletarDeRestaurante.bind(enderecoController)));

export default router;
