// src/routes/adicionalGrupoRoutes.js

import express from 'express';
import AdicionalGrupoController from '../controllers/AdicionalGrupoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const adicionalGrupoController = new AdicionalGrupoController();

router
    .get('/adicionais/grupos/prato/:pratoId', asyncWrapper(adicionalGrupoController.listarPorPrato.bind(adicionalGrupoController)))
    .get('/adicionais/grupos/:id', asyncWrapper(adicionalGrupoController.buscarPorID.bind(adicionalGrupoController)))
    .post('/adicionais/grupos', AuthMiddleware, asyncWrapper(adicionalGrupoController.criar.bind(adicionalGrupoController)))
    .patch('/adicionais/grupos/:id', AuthMiddleware, asyncWrapper(adicionalGrupoController.atualizar.bind(adicionalGrupoController)))
    .delete('/adicionais/grupos/:id', AuthMiddleware, asyncWrapper(adicionalGrupoController.deletar.bind(adicionalGrupoController)));

export default router;
