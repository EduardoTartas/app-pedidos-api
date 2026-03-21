// src/seeds/seedsCategoria.js

import 'dotenv/config';
import Categoria from '../models/Categoria.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedCategorias() {
    await Categoria.deleteMany();

    const categorias = [
        { nome: 'Pizzaria', icone_categoria: '', ativo: true },
        { nome: 'Hamburgueria', icone_categoria: '', ativo: true },
        { nome: 'Japonesa', icone_categoria: '', ativo: true },
        { nome: 'Brasileira', icone_categoria: '', ativo: true },
        { nome: 'Doces e Sobremesas', icone_categoria: '', ativo: true },
        { nome: 'Bebidas', icone_categoria: '', ativo: true },
        { nome: 'Açaí', icone_categoria: '', ativo: true },
        { nome: 'Italiana', icone_categoria: '', ativo: true },
        { nome: 'Lanches', icone_categoria: '', ativo: true },
        { nome: 'Saudável', icone_categoria: '', ativo: true },
    ];

    const created = await Categoria.insertMany(categorias);
    console.log(`[SEED] ${created.length} categorias criadas.`);
    return created;
}

export default seedCategorias;
