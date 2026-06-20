// src/routes/dispositivoRoutes.js
import express from 'express';
import DispositivoController from '../controllers/DispositivoController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

router.post('/dispositivos/registrar', AuthMiddleware, DispositivoController.registrar);
router.post('/dispositivos/desativar-token', AuthMiddleware, DispositivoController.desativar);

export default router;
