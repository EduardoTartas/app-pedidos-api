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
            cpf_cnpj: '00000000000',
            telefone: '11999999999',
            status: 'ativo',
            isAdmin: true,
            endereco: {
                logradouro: 'Rua Principal',
                cep: '01001000',
                bairro: 'Centro',
                numero: '100',
                cidade: 'São Paulo',
                estado: 'SP'
            }
        },
        {
            nome: 'Dono Restaurante 1',
            email: 'dono1@delivery.com',
            senha: senhaHash,
            cpf_cnpj: '11111111111',
            telefone: '11988888888',
            status: 'ativo',
            isAdmin: false,
            endereco: {
                logradouro: 'Av. Paulista',
                cep: '01310100',
                bairro: 'Bela Vista',
                numero: '500',
                cidade: 'São Paulo',
                estado: 'SP'
            }
        },
        {
            nome: 'Dono Restaurante 2',
            email: 'dono2@delivery.com',
            senha: senhaHash,
            cpf_cnpj: '22222222222',
            telefone: '11977777777',
            status: 'ativo',
            isAdmin: false,
            endereco: {
                logradouro: 'Rua Augusta',
                cep: '01304000',
                bairro: 'Consolação',
                numero: '200',
                cidade: 'São Paulo',
                estado: 'SP'
            }
        },
        {
            nome: 'Cliente Teste',
            email: 'cliente@delivery.com',
            senha: senhaHash,
            cpf_cnpj: '33333333333',
            telefone: '11966666666',
            status: 'ativo',
            isAdmin: false,
            endereco: {
                logradouro: 'Rua das Flores',
                cep: '01001001',
                bairro: 'Jardins',
                numero: '50',
                cidade: 'São Paulo',
                estado: 'SP'
            }
        },
        {
            nome: 'Cliente Inativo',
            email: 'inativo@delivery.com',
            senha: senhaHash,
            cpf_cnpj: '44444444444',
            telefone: '11955555555',
            status: 'inativo',
            isAdmin: false,
            endereco: {
                logradouro: 'Rua Inativa',
                cep: '01001002',
                bairro: 'Centro',
                numero: '10',
                cidade: 'São Paulo',
                estado: 'SP'
            }
        }
    ];

    const created = await Usuario.insertMany(usuarios);
    console.log(`[SEED] ${created.length} usuários criados.`);
    console.log(`[SEED] Senha padrão: ${senhaPura}`);
    return created;
}

export default seedUsuarios;
