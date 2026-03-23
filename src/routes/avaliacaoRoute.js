import express from 'express';
import AvaliacaoController from '../controllers/AvaliacaoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const avaliacaoController = new AvaliacaoController();

router
    .get('/avaliacoes/restaurante/:restauranteId', asyncWrapper(avaliacaoController.listarPorRestaurante.bind(avaliacaoController)))
    .post('/avaliacoes', AuthMiddleware, asyncWrapper(avaliacaoController.criar.bind(avaliacaoController)));

export default router;
