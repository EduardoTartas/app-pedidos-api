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
            cnpj: '11111111000111',
            status: 'aberto',
            ativo: true,
            deletado: false,
            categoria_ids: [pizzaCat._id],
            secoes_cardapio: ['Pizzas Tradicionais', 'Pizzas Especiais', 'Bebidas'],
            horario_funcionamento: [
                { dia: 'segunda', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'terca', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'quarta', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'quinta', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'sexta', abertura: '18:00', fechamento: '00:00', fechado: false },
                { dia: 'sabado', abertura: '18:00', fechamento: '00:00', fechado: false },
                { dia: 'domingo', abertura: '18:00', fechamento: '23:00', fechado: false },
            ],
            estimativa_entrega_min: 30,
            estimativa_entrega_max: 50,
            taxa_entrega: 5.99,
            avaliacao_media: 0
        },
        {
            nome: 'Burger House',
            foto_restaurante: '',
            dono_id: dono1._id,
            cnpj: '22222222000122',
            status: 'aberto',
            ativo: true,
            deletado: false,
            categoria_ids: [hamburCat._id],
            secoes_cardapio: ['Hambúrgueres Clássicos', 'Hambúrgueres Artesanais', 'Acompanhamentos', 'Bebidas'],
            horario_funcionamento: [
                { dia: 'segunda', abertura: '11:00', fechamento: '23:00', fechado: false },
                { dia: 'terca', abertura: '11:00', fechamento: '23:00', fechado: false },
                { dia: 'quarta', abertura: '11:00', fechamento: '23:00', fechado: false },
                { dia: 'quinta', abertura: '11:00', fechamento: '23:00', fechado: false },
                { dia: 'sexta', abertura: '11:00', fechamento: '01:00', fechado: false },
                { dia: 'sabado', abertura: '11:00', fechamento: '01:00', fechado: false },
                { dia: 'domingo', abertura: '11:00', fechamento: '23:00', fechado: false },
            ],
            estimativa_entrega_min: 25,
            estimativa_entrega_max: 40,
            taxa_entrega: 4.50,
            avaliacao_media: 0
        },
        {
            nome: 'Sushi Kento',
            foto_restaurante: '',
            dono_id: dono2._id,
            cnpj: '33333333000133',
            status: 'aberto',
            ativo: true,
            deletado: false,
            categoria_ids: [japCat._id],
            secoes_cardapio: ['Sushis', 'Sashimis', 'Combos', 'Bebidas'],
            horario_funcionamento: [
                { dia: 'segunda', abertura: '18:00', fechamento: '23:00', fechado: true },
                { dia: 'terca', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'quarta', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'quinta', abertura: '18:00', fechamento: '23:00', fechado: false },
                { dia: 'sexta', abertura: '18:00', fechamento: '00:00', fechado: false },
                { dia: 'sabado', abertura: '18:00', fechamento: '00:00', fechado: false },
                { dia: 'domingo', abertura: '11:00', fechamento: '22:00', fechado: false },
            ],
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
