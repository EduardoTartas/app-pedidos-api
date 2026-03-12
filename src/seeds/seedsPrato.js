// src/seeds/seedsPrato.js

import 'dotenv/config';
import Prato from '../models/Prato.js';
import Restaurante from '../models/Restaurante.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedPratos() {
    await Prato.deleteMany();

    const restaurantes = await Restaurante.find();
    const pizza = restaurantes.find(r => r.nome === 'Pizza do Zé');
    const burger = restaurantes.find(r => r.nome === 'Burger House');
    const sushi = restaurantes.find(r => r.nome === 'Sushi Kento');

    const pratos = [
        // Pizza do Zé
        { restaurante_id: pizza._id, nome: 'Pizza Margherita', preco: 39.90, descricao: 'Molho de tomate, mussarela e manjericão.', secao: 'Pizzas Tradicionais', status: 'ativo' },
        { restaurante_id: pizza._id, nome: 'Pizza Calabresa', preco: 42.90, descricao: 'Calabresa fatiada, cebola e azeitonas.', secao: 'Pizzas Tradicionais', status: 'ativo' },
        { restaurante_id: pizza._id, nome: 'Pizza Quatro Queijos', preco: 49.90, descricao: 'Mussarela, provolone, gorgonzola e parmesão.', secao: 'Pizzas Especiais', status: 'ativo' },
        { restaurante_id: pizza._id, nome: 'Pizza Frango com Catupiry', preco: 46.90, descricao: 'Frango desfiado com catupiry.', secao: 'Pizzas Especiais', status: 'ativo' },
        { restaurante_id: pizza._id, nome: 'Refrigerante 2L', preco: 12.00, descricao: 'Coca-Cola, Guaraná ou Fanta.', secao: 'Bebidas', status: 'ativo' },

        // Burger House
        { restaurante_id: burger._id, nome: 'X-Burger', preco: 22.90, descricao: 'Pão, hambúrguer, queijo e salada.', secao: 'Hambúrgueres Clássicos', status: 'ativo' },
        { restaurante_id: burger._id, nome: 'X-Bacon', preco: 27.90, descricao: 'Pão, hambúrguer, queijo, bacon crocante.', secao: 'Hambúrgueres Clássicos', status: 'ativo' },
        { restaurante_id: burger._id, nome: 'Smash Burger Duplo', preco: 34.90, descricao: 'Dois smash burgers com cheddar.', secao: 'Hambúrgueres Artesanais', status: 'ativo' },
        { restaurante_id: burger._id, nome: 'Batata Frita', preco: 14.90, descricao: 'Porção de batata frita crocante.', secao: 'Acompanhamentos', status: 'ativo' },
        { restaurante_id: burger._id, nome: 'Milkshake', preco: 16.90, descricao: 'Chocolate, morango ou baunilha.', secao: 'Bebidas', status: 'ativo' },

        // Sushi Kento
        { restaurante_id: sushi._id, nome: 'Salmão Niguiri (4un)', preco: 24.90, descricao: 'Niguiri de salmão fresco.', secao: 'Sushis', status: 'ativo' },
        { restaurante_id: sushi._id, nome: 'Hot Roll (8un)', preco: 28.90, descricao: 'Hot roll empanado com cream cheese.', secao: 'Sushis', status: 'ativo' },
        { restaurante_id: sushi._id, nome: 'Sashimi Salmão (10 fatias)', preco: 38.90, descricao: 'Fatias de salmão fresco.', secao: 'Sashimis', status: 'ativo' },
        { restaurante_id: sushi._id, nome: 'Combo Kento (30 peças)', preco: 69.90, descricao: 'Sushis variados, hot rolls e sashimis.', secao: 'Combos', status: 'ativo' },
        { restaurante_id: sushi._id, nome: 'Chá Verde', preco: 8.00, descricao: 'Chá verde japonês.', secao: 'Bebidas', status: 'ativo' },
    ];

    const created = await Prato.insertMany(pratos);
    console.log(`[SEED] ${created.length} pratos criados.`);
    return created;
}

export default seedPratos;
