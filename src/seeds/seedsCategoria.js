// src/seeds/seedsCategoria.js

import 'dotenv/config';
import Categoria from '../models/Categoria.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedCategorias() {
    await Categoria.deleteMany();

    const categorias = [
        { nome: 'Pizzaria', img: '', ativo: true },
        { nome: 'Hamburgueria', img: '', ativo: true },
        { nome: 'Japonesa', img: '', ativo: true },
        { nome: 'Brasileira', img: '', ativo: true },
        { nome: 'Doces e Sobremesas', img: '', ativo: true },
        { nome: 'Bebidas', img: '', ativo: true },
        { nome: 'Açaí', img: '', ativo: true },
        { nome: 'Italiana', img: '', ativo: true },
        { nome: 'Lanches', img: '', ativo: true },
        { nome: 'Saudável', img: '', ativo: true },
    ];

    const created = await Categoria.insertMany(categorias);
    console.log(`[SEED] ${created.length} categorias criadas.`);
    return created;
}

export default seedCategorias;
