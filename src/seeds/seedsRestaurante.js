// src/seeds/seedsRestaurante.js

import 'dotenv/config';
import Restaurante from '../models/Restaurante.js';
import Categoria from '../models/Categoria.js';
import Usuario from '../models/Usuario.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedRestaurantes() {
    await Restaurante.deleteMany();

    const categorias = await Categoria.find();
    const usuarios = await Usuario.find();

    const dono1 = usuarios.find(u => u.email === 'dono1@delivery.com');
    const dono2 = usuarios.find(u => u.email === 'dono2@delivery.com');

    if (!dono1 || !dono2) {
        throw new Error('Donos de restaurante não encontrados. Rode o seed de usuários primeiro.');
    }

    const pizzaCat = categorias.find(c => c.nome === 'Pizzaria');
    const hamburCat = categorias.find(c => c.nome === 'Hamburgueria');
    const japCat = categorias.find(c => c.nome === 'Japonesa');

    const restaurantes = [
        {
            nome: 'Pizza do Zé',
            foto_restaurante: '',
            dono_id: dono1._id,
            status: 'aberto',
            endereco: {
                logradouro: 'Rua das Pizzas',
                cep: '01001000',
                bairro: 'Centro',
                numero: '42',
                cidade: 'São Paulo',
                estado: 'SP'
            },
            categoria_ids: [pizzaCat._id],
            secoes_cardapio: ['Pizzas Tradicionais', 'Pizzas Especiais', 'Bebidas'],
            estimativa_entrega_min: 30,
            estimativa_entrega_max: 50,
            taxa_entrega: 5.99,
            avaliacao_media: 0
        },
        {
            nome: 'Burger House',
            foto_restaurante: '',
            dono_id: dono1._id,
            status: 'aberto',
            endereco: {
                logradouro: 'Av. dos Hambúrgueres',
                cep: '01310100',
                bairro: 'Bela Vista',
                numero: '100',
                cidade: 'São Paulo',
                estado: 'SP'
            },
            categoria_ids: [hamburCat._id],
            secoes_cardapio: ['Hambúrgueres Clássicos', 'Hambúrgueres Artesanais', 'Acompanhamentos', 'Bebidas'],
            estimativa_entrega_min: 25,
            estimativa_entrega_max: 40,
            taxa_entrega: 4.50,
            avaliacao_media: 0
        },
        {
            nome: 'Sushi Kento',
            foto_restaurante: '',
            dono_id: dono2._id,
            status: 'aberto',
            endereco: {
                logradouro: 'Rua Liberdade',
                cep: '01503000',
                bairro: 'Liberdade',
                numero: '88',
                cidade: 'São Paulo',
                estado: 'SP'
            },
            categoria_ids: [japCat._id],
            secoes_cardapio: ['Sushis', 'Sashimis', 'Combos', 'Bebidas'],
            estimativa_entrega_min: 35,
            estimativa_entrega_max: 55,
            taxa_entrega: 7.00,
            avaliacao_media: 0
        }
    ];

    const created = await Restaurante.insertMany(restaurantes);
    console.log(`[SEED] ${created.length} restaurantes criados.`);
    return created;
}

export default seedRestaurantes;
