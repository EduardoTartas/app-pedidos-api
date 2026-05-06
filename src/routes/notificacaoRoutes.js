import express from 'express';
import NotificacaoController from '../controllers/NotificacaoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const notificacaoController = new NotificacaoController();

router
    .get('/notificacoes', AuthMiddleware, asyncWrapper(notificacaoController.listarMinhas.bind(notificacaoController)))
    .get('/notificacoes/:id', AuthMiddleware, asyncWrapper(notificacaoController.buscarPorId.bind(notificacaoController)))
    .patch('/notificacoes/:id/lida', AuthMiddleware, asyncWrapper(notificacaoController.marcarComoLida.bind(notificacaoController)))
    .delete('/notificacoes/:id', AuthMiddleware, asyncWrapper(notificacaoController.deletar.bind(notificacaoController)));

export default router;