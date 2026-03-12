// src/seeds/seedsEndereco.js

import 'dotenv/config';
import Endereco from '../models/Endereco.js';
import Usuario from '../models/Usuario.js';
import Restaurante from '../models/Restaurante.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedEnderecos() {
    await Endereco.deleteMany();

    const usuarios = await Usuario.find();
    const restaurantes = await Restaurante.find();

    const admin = usuarios.find(u => u.email === 'admin@delivery.com');
    const dono1 = usuarios.find(u => u.email === 'dono1@delivery.com');
    const dono2 = usuarios.find(u => u.email === 'dono2@delivery.com');
    const cliente = usuarios.find(u => u.email === 'cliente@delivery.com');
    const inativo = usuarios.find(u => u.email === 'inativo@delivery.com');

    const pizzaZe = restaurantes.find(r => r.nome === 'Pizza do Zé');
    const burgerHouse = restaurantes.find(r => r.nome === 'Burger House');
    const sushiKento = restaurantes.find(r => r.nome === 'Sushi Kento');

    const enderecos = [
        // Endereços de usuários
        {
            usuario_id: admin._id,
            label: 'Casa',
            cep: '01001-000',
            rua: 'Rua Principal',
            numero: '100',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        {
            usuario_id: dono1._id,
            label: 'Casa',
            cep: '01310-100',
            rua: 'Av. Paulista',
            numero: '500',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        {
            usuario_id: dono2._id,
            label: 'Casa',
            cep: '01304-000',
            rua: 'Rua Augusta',
            numero: '200',
            bairro: 'Consolação',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        {
            usuario_id: cliente._id,
            label: 'Casa',
            cep: '01001-001',
            rua: 'Rua das Flores',
            numero: '50',
            bairro: 'Jardins',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        {
            usuario_id: cliente._id,
            label: 'Trabalho',
            cep: '04543-011',
            rua: 'Av. Engenheiro Luís Carlos Berrini',
            numero: '1376',
            bairro: 'Cidade Monções',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: false
        },
        {
            usuario_id: inativo._id,
            label: 'Casa',
            cep: '01001-002',
            rua: 'Rua Inativa',
            numero: '10',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        // Endereços de restaurantes
        {
            restaurante_id: pizzaZe._id,
            cep: '01001-000',
            rua: 'Rua das Pizzas',
            numero: '42',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        {
            restaurante_id: burgerHouse._id,
            cep: '01310-100',
            rua: 'Av. dos Hambúrgueres',
            numero: '100',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        },
        {
            restaurante_id: sushiKento._id,
            cep: '01503-000',
            rua: 'Rua Liberdade',
            numero: '88',
            bairro: 'Liberdade',
            cidade: 'São Paulo',
            estado: 'SP',
            principal: true
        }
    ];

    const created = await Endereco.insertMany(enderecos);
    console.log(`[SEED] ${created.length} endereços criados.`);
    return created;
}

export default seedEnderecos;
