// src/seeds/seedsUsuario.js

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

const senhaPura = 'Senha123';
const senhaHash = bcrypt.hashSync(senhaPura, 8);

async function seedUsuarios() {
    await Usuario.deleteMany();

    const usuarios = [
        {
            nome: 'Admin Sistema',
            email: 'admin@delivery.com',
            senha: senhaHash,
            cpf: '00000000000',
            telefone: '11999999999',
            status: 'ativo',
            isAdmin: true
        },
        {
            nome: 'Dono Restaurante 1',
            email: 'dono1@delivery.com',
            senha: senhaHash,
            cpf: '11111111111',
            telefone: '11988888888',
            status: 'ativo',
            isAdmin: false
        },
        {
            nome: 'Dono Restaurante 2',
            email: 'dono2@delivery.com',
            senha: senhaHash,
            cpf: '22222222222',
            telefone: '11977777777',
            status: 'ativo',
            isAdmin: false
        },
        {
            nome: 'Cliente Teste',
            email: 'cliente@delivery.com',
            senha: senhaHash,
            cpf: '33333333333',
            telefone: '11966666666',
            status: 'ativo',
            isAdmin: false
        },
        {
            nome: 'Cliente Inativo',
            email: 'inativo@delivery.com',
            senha: senhaHash,
            cpf: '44444444444',
            telefone: '11955555555',
            status: 'inativo',
            isAdmin: false
        }
    ];

    const created = await Usuario.insertMany(usuarios);

    console.log(`[SEED] ${created.length} usuários criados.`);
    console.log(`[SEED] Senha padrão: ${senhaPura}`);
    return created;
}

export default seedUsuarios;
