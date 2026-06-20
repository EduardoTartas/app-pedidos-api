// src/app.js

import cors from "cors";
import helmet from "helmet";
import errorHandler from './utils/helpers/errorHandler.js';
import logger from './utils/logger.js';
import DbConnect from './config/dbConnect.js';
import setupGarage from './config/setupGarage.js';
import routes from './routes/index.js';
import CommonResponse from './utils/helpers/CommonResponse.js';
import express from "express";
import expressFileUpload from "express-fileupload";
import compression from 'compression';

const app = express();

await DbConnect.conectar();
await setupGarage();

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
        }
    }
}));

// Habilitando CORS
app.use(cors());

// Habilitando a compressão de respostas
app.use(compression());

// Habilitando o uso de json pelo express
app.use(express.json());

// Habilitando o uso de arquivos pelo express, com limite de segurança em memória de 50MB
app.use(expressFileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Trava em 50MB para não esgotar a RAM
    abortOnLimit: true // Rejeita a requisição e poupa a banda automaticamente se passar
}));

// Configuração para o proxy confiar no cliente
app.set('trust proxy', true);

// Habilitando o uso de urlencoded pelo express
app.use(express.urlencoded({ extended: true }));

// Servindo arquivos estáticos da pasta public
app.use('/public', express.static('public'));

// Servindo arquivo assetlinks.json para Android App Links
app.get('/.well-known/assetlinks.json', (req, res) => {
    res.json([{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "dev.fslab.pedidos",
            "sha256_cert_fingerprints": [
                "F1:2E:B8:1B:61:37:FC:84:4F:C1:EB:E8:DE:BC:54:C2:41:E6:4E:3C:89:20:F2:C7:39:E2:F3:D1:59:AB:D2:45"
            ]
        }
    }]);
});

// Passando para o arquivo de rotas o app
routes(app);

// Middleware para lidar com rotas não encontradas (404)
app.use((req, res, next) => {
    return CommonResponse.error(
        res,
        404,
        'resourceNotFound',
        null,
        [{
            message: 'Rota não encontrada.'
        }]
    );
});

// Listener para erros não tratados
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', error);
});

// Middleware de Tratamento de Erros (deve ser adicionado após as rotas)
app.use(errorHandler);

// Exportando para o server.js fazer uso
export default app;
