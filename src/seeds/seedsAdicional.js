// src/seeds/seedsAdicional.js

import 'dotenv/config';
import AdicionalGrupo from '../models/AdicionalGrupo.js';
import AdicionalOpcao from '../models/AdicionalOpcao.js';
import Prato from '../models/Prato.js';
import Restaurante from '../models/Restaurante.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedAdicionais() {
    await AdicionalOpcao.deleteMany();
    await AdicionalGrupo.deleteMany();

    const restaurantes = await Restaurante.find();
    const pizza = restaurantes.find(r => r.nome === 'Pizza do Zé');
    const burger = restaurantes.find(r => r.nome === 'Burger House');

    // Grupos para Pizza do Zé
    const grupoTamanho = await AdicionalGrupo.create({
        restaurante_id: pizza._id,
        nome: 'Tamanho',
        tipo: 'variacao',
        obrigatorio: true,
        min: 1,
        max: 1,
        ativo: true
    });

    const grupoBorda = await AdicionalGrupo.create({
        restaurante_id: pizza._id,
        nome: 'Borda Recheada',
        tipo: 'adicional',
        obrigatorio: false,
        min: 0,
        max: 1,
        ativo: true
    });

    // Grupos para Burger House
    const grupoAdicionaisBurger = await AdicionalGrupo.create({
        restaurante_id: burger._id,
        nome: 'Adicionais do Burger',
        tipo: 'adicional',
        obrigatorio: false,
        min: 0,
        max: 5,
        ativo: true
    });

    const grupoBebidaBurger = await AdicionalGrupo.create({
        restaurante_id: burger._id,
        nome: 'Escolha da Bebida',
        tipo: 'variacao',
        obrigatorio: false,
        min: 0,
        max: 1,
        ativo: true
    });

    // Opções de Tamanho
    await AdicionalOpcao.insertMany([
        { grupo_id: grupoTamanho._id, nome: 'Pequena (4 fatias)', preco: 0, ativo: true },
        { grupo_id: grupoTamanho._id, nome: 'Média (6 fatias)', preco: 10.00, ativo: true },
        { grupo_id: grupoTamanho._id, nome: 'Grande (8 fatias)', preco: 20.00, ativo: true },
        { grupo_id: grupoTamanho._id, nome: 'Família (12 fatias)', preco: 35.00, ativo: true },
    ]);

    // Opções de Borda
    await AdicionalOpcao.insertMany([
        { grupo_id: grupoBorda._id, nome: 'Borda de Catupiry', preco: 8.00, ativo: true },
        { grupo_id: grupoBorda._id, nome: 'Borda de Cheddar', preco: 8.00, ativo: true },
        { grupo_id: grupoBorda._id, nome: 'Borda de Chocolate', preco: 10.00, ativo: true },
    ]);

    // Opções de Adicionais do Burger
    await AdicionalOpcao.insertMany([
        { grupo_id: grupoAdicionaisBurger._id, nome: 'Bacon Extra', preco: 5.00, ativo: true },
        { grupo_id: grupoAdicionaisBurger._id, nome: 'Queijo Cheddar Extra', preco: 4.00, ativo: true },
        { grupo_id: grupoAdicionaisBurger._id, nome: 'Ovo', preco: 3.00, ativo: true },
        { grupo_id: grupoAdicionaisBurger._id, nome: 'Cebola Caramelizada', preco: 4.00, ativo: true },
        { grupo_id: grupoAdicionaisBurger._id, nome: 'Hambúrguer Extra', preco: 8.00, ativo: true },
    ]);

    // Opções de Bebida no combo burger
    await AdicionalOpcao.insertMany([
        { grupo_id: grupoBebidaBurger._id, nome: 'Coca-Cola Lata', preco: 0, ativo: true },
        { grupo_id: grupoBebidaBurger._id, nome: 'Guaraná Lata', preco: 0, ativo: true },
        { grupo_id: grupoBebidaBurger._id, nome: 'Suco Natural', preco: 2.00, ativo: true },
    ]);

    // Vincular grupos aos pratos
    const pratosPizza = await Prato.find({ restaurante_id: pizza._id, secao: { $in: ['Pizzas Tradicionais', 'Pizzas Especiais'] } });
    for (const prato of pratosPizza) {
        prato.adicionais_grupo_ids = [grupoTamanho._id, grupoBorda._id];
        await prato.save();
    }

    const pratosBurger = await Prato.find({ restaurante_id: burger._id, secao: { $in: ['Hambúrgueres Clássicos', 'Hambúrgueres Artesanais'] } });
    for (const prato of pratosBurger) {
        prato.adicionais_grupo_ids = [grupoAdicionaisBurger._id];
        await prato.save();
    }

    console.log('[SEED] Grupos e opções de adicionais criados e vinculados.');
}

export default seedAdicionais;
