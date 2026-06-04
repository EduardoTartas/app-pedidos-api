// scripts/verificar_inatividade.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RestauranteService from '../src/service/RestauranteService.js';

dotenv.config();

const DB_URL = process.env.DB_URL;

async function run() {
    try {
        console.log("--- TAREFA DE INATIVIDADE ---");
        await mongoose.connect(DB_URL);
        console.log("Conectado ao MongoDB.");

        const service = new RestauranteService();
        const resultado = await service.verificarInatividade();

        console.log("-----------------------------");
        console.log(`Processados: ${resultado.processados}`);
        console.log(`Inativados:  ${resultado.inativados}`);
        console.log("-----------------------------");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Erro na tarefa de inatividade:", error);
        process.exit(1);
    }
}

run();
