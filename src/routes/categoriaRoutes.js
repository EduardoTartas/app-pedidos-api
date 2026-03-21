// src/routes/categoriaRoutes.js

import express from 'express';
import CategoriaController from '../controllers/CategoriaController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const categoriaController = new CategoriaController();

router
    .get('/categorias', asyncWrapper(categoriaController.listar.bind(categoriaController)))
    .get('/categorias/:id', asyncWrapper(categoriaController.listar.bind(categoriaController)))
    .post('/categorias', AuthMiddleware, asyncWrapper(categoriaController.criar.bind(categoriaController)))
    .patch('/categorias/:id', AuthMiddleware, asyncWrapper(categoriaController.atualizar.bind(categoriaController)))
    .delete('/categorias/:id', AuthMiddleware, asyncWrapper(categoriaController.deletar.bind(categoriaController)))
    .post('/categorias/:id/foto', AuthMiddleware, asyncWrapper(categoriaController.fotoUpload.bind(categoriaController)))
    .delete('/categorias/:id/foto', AuthMiddleware, asyncWrapper(categoriaController.fotoDelete.bind(categoriaController)));

export default router;
