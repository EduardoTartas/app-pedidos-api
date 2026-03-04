// src/seeds/seeds.js

import 'dotenv/config';
import mongoose from 'mongoose';
import seedUsuarios from './seedsUsuario.js';
//import seedCategorias from './seedsCategoria.js';
//import seedRestaurantes from './seedsRestaurante.js';
//import seedPratos from './seedsPrato.js';
//import seedAdicionais from './seedsAdicional.js';

async function main() {
    try {
        //await seedCategorias();
        await seedUsuarios();
        //await seedRestaurantes();
        //await seedPratos();
        //await seedAdicionais();

        console.log('>>> SEED FINALIZADO COM SUCESSO! <<<');
    } catch (err) {
        console.error('Erro ao executar SEED:', err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

main();
