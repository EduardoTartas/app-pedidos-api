// src/routes/index.js

import express from 'express';
import logRoutes from '../middlewares/LogRoutesMiddleware.js';
import dotenv from 'dotenv';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import getSwaggerOptions from '../docs/config/head.js';
import mongoose from 'mongoose';

// Importação das rotas
import authRoutes from './authRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import categoriaRoutes from './categoriaRoutes.js';
import restauranteRoutes from './restauranteRoutes.js';
import enderecoRoutes from './enderecoRoutes.js';
import pratoRoutes from './pratoRoutes.js';
import adicionalGrupoRoutes from './adicionalGrupoRoutes.js';
import adicionalOpcaoRoutes from './adicionalOpcaoRoutes.js';
import pedidoRoutes from './pedidoRoutes.js';
//import avaliacaoRoutes from './avaliacaoRoutes.js';
import notificacaoRoutes from './notificacaoRoutes.js';

dotenv.config();

const routes = (app) => {
    // Middleware de log, se ativado
    if (process.env.DEBUGLOG) {
        app.use(logRoutes);
    }

    app.get('/', (req, res) => {
        res.redirect('/docs');
    });

    app.use(swaggerUI.serve);
    app.get('/docs', async (req, res, next) => {
        const opts = await getSwaggerOptions();
        const swaggerDocs = swaggerJSDoc(opts);
        swaggerUI.setup(swaggerDocs)(req, res, next);
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        const isConnected = mongoose.connection.readyState === 1;

        res.status(isConnected ? 200 : 503).json({
            status: isConnected ? 'healthy' : 'unhealthy',
            database: isConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // Registra todas as rotas
    app.use(
        express.json(),
        authRoutes,
        usuarioRoutes,
        categoriaRoutes,
        restauranteRoutes,
        enderecoRoutes,
        pratoRoutes,
        adicionalGrupoRoutes,
        adicionalOpcaoRoutes,
        pedidoRoutes,
        //avaliacaoRoutes,
        notificacaoRoutes
    );
};

export default routes;
