// src/routes/adicionalOpcaoRoutes.js

import express from 'express';
import AdicionalOpcaoController from '../controllers/AdicionalOpcaoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const adicionalOpcaoController = new AdicionalOpcaoController();

router
    .get('/adicionais/opcoes/:grupoId', asyncWrapper(adicionalOpcaoController.listar.bind(adicionalOpcaoController)))
    .post('/adicionais/opcoes', AuthMiddleware, asyncWrapper(adicionalOpcaoController.criar.bind(adicionalOpcaoController)))
    .patch('/adicionais/opcoes/:id', AuthMiddleware, asyncWrapper(adicionalOpcaoController.atualizar.bind(adicionalOpcaoController)))
    .delete('/adicionais/opcoes/:id', AuthMiddleware, asyncWrapper(adicionalOpcaoController.deletar.bind(adicionalOpcaoController)));

export default router;
