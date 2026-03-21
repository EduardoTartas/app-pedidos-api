// src/seeds/seedsPedido.js

import 'dotenv/config';
import Pedido from '../models/Pedido.js';
import Usuario from '../models/Usuario.js';
import Restaurante from '../models/Restaurante.js';
import Prato from '../models/Prato.js';
import AdicionalOpcao from '../models/AdicionalOpcao.js';
import AdicionalGrupo from '../models/AdicionalGrupo.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedPedidos() {
    await Pedido.deleteMany();

    const usuarios = await Usuario.find();
    const restaurantes = await Restaurante.find();
    const pratos = await Prato.find();
    const grupos = await AdicionalGrupo.find();
    const opcoes = await AdicionalOpcao.find();

    const cliente = usuarios.find(u => u.email === 'cliente@delivery.com');
    const dono1 = usuarios.find(u => u.email === 'dono1@delivery.com');

    if (!cliente || !dono1) {
        throw new Error('Usuários não encontrados. Rode o seed de usuários primeiro.');
    }

    const pizza = restaurantes.find(r => r.nome === 'Pizza do Zé');
    const burger = restaurantes.find(r => r.nome === 'Burger House');
    const sushi = restaurantes.find(r => r.nome === 'Sushi Kento');

    if (!pizza || !burger || !sushi) {
        throw new Error('Restaurantes não encontrados. Rode o seed de restaurantes primeiro.');
    }

    // Pratos
    const margherita = pratos.find(p => p.nome === 'Pizza Margherita');
    const calabresa = pratos.find(p => p.nome === 'Pizza Calabresa');
    const refri2l = pratos.find(p => p.nome === 'Refrigerante 2L');
    const xBurger = pratos.find(p => p.nome === 'X-Burger');
    const xBacon = pratos.find(p => p.nome === 'X-Bacon');
    const batataFrita = pratos.find(p => p.nome === 'Batata Frita');
    const milkshake = pratos.find(p => p.nome === 'Milkshake');
    const salmaoNiguiri = pratos.find(p => p.nome === 'Salmão Niguiri (4un)');
    const comboKento = pratos.find(p => p.nome === 'Combo Kento (30 peças)');
    const chaVerde = pratos.find(p => p.nome === 'Chá Verde');

    // Adicionais (opções)
    const grupoTamanho = grupos.find(g => g.nome === 'Tamanho');
    const grupoBorda = grupos.find(g => g.nome === 'Borda Recheada');
    const grupoAdicionaisBurger = grupos.find(g => g.nome === 'Adicionais do Burger');

    const opcaoMedia = opcoes.find(o => o.nome === 'Média (6 fatias)' && String(o.grupo_id) === String(grupoTamanho?._id));
    const opcaoGrande = opcoes.find(o => o.nome === 'Grande (8 fatias)' && String(o.grupo_id) === String(grupoTamanho?._id));
    const opcaoBordaCatupiry = opcoes.find(o => o.nome === 'Borda de Catupiry' && String(o.grupo_id) === String(grupoBorda?._id));
    const opcaoBaconExtra = opcoes.find(o => o.nome === 'Bacon Extra' && String(o.grupo_id) === String(grupoAdicionaisBurger?._id));
    const opcaoCheddarExtra = opcoes.find(o => o.nome === 'Queijo Cheddar Extra' && String(o.grupo_id) === String(grupoAdicionaisBurger?._id));

    const agora = new Date();
    const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const doisDiasAtras = new Date(agora.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tresDiasAtras = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000);

    const pedidos = [
        // Pedido 1: Cliente pede pizza com adicionais — Entregue
        {
            cliente_id: cliente._id,
            restaurante_id: pizza._id,
            status: 'entregue',
            itens: [
                {
                    prato_id: margherita._id,
                    prato_nome: margherita.nome,
                    preco_unitario: margherita.preco,
                    quantidade: 1,
                    adicionais: opcaoMedia ? [
                        {
                            opcao_id: opcaoMedia._id,
                            opcao_nome: opcaoMedia.nome,
                            preco_unitario: opcaoMedia.preco,
                            quantidade: 1
                        },
                        ...(opcaoBordaCatupiry ? [{
                            opcao_id: opcaoBordaCatupiry._id,
                            opcao_nome: opcaoBordaCatupiry.nome,
                            preco_unitario: opcaoBordaCatupiry.preco,
                            quantidade: 1
                        }] : [])
                    ] : []
                },
                {
                    prato_id: refri2l._id,
                    prato_nome: refri2l.nome,
                    preco_unitario: refri2l.preco,
                    quantidade: 1,
                    adicionais: []
                }
            ],
            totais: {
                subtotal: margherita.preco + (opcaoMedia?.preco || 0) + (opcaoBordaCatupiry?.preco || 0) + refri2l.preco,
                taxa_entrega: pizza.taxa_entrega,
                total: margherita.preco + (opcaoMedia?.preco || 0) + (opcaoBordaCatupiry?.preco || 0) + refri2l.preco + pizza.taxa_entrega
            },
            historico_status: [
                { status: 'criado', data: tresDiasAtras },
                { status: 'em_preparo', data: new Date(tresDiasAtras.getTime() + 5 * 60 * 1000) },
                { status: 'a_caminho', data: new Date(tresDiasAtras.getTime() + 35 * 60 * 1000) },
                { status: 'entregue', data: new Date(tresDiasAtras.getTime() + 55 * 60 * 1000) }
            ],
            createdAt: tresDiasAtras
        },

        // Pedido 2: Cliente pede burger com adicionais — A caminho
        {
            cliente_id: cliente._id,
            restaurante_id: burger._id,
            status: 'a_caminho',
            itens: [
                {
                    prato_id: xBacon._id,
                    prato_nome: xBacon.nome,
                    preco_unitario: xBacon.preco,
                    quantidade: 2,
                    adicionais: opcaoBaconExtra ? [
                        {
                            opcao_id: opcaoBaconExtra._id,
                            opcao_nome: opcaoBaconExtra.nome,
                            preco_unitario: opcaoBaconExtra.preco,
                            quantidade: 1
                        },
                        ...(opcaoCheddarExtra ? [{
                            opcao_id: opcaoCheddarExtra._id,
                            opcao_nome: opcaoCheddarExtra.nome,
                            preco_unitario: opcaoCheddarExtra.preco,
                            quantidade: 1
                        }] : [])
                    ] : []
                },
                {
                    prato_id: batataFrita._id,
                    prato_nome: batataFrita.nome,
                    preco_unitario: batataFrita.preco,
                    quantidade: 1,
                    adicionais: []
                }
            ],
            totais: {
                subtotal: (xBacon.preco + (opcaoBaconExtra?.preco || 0) + (opcaoCheddarExtra?.preco || 0)) * 2 + batataFrita.preco,
                taxa_entrega: burger.taxa_entrega,
                total: (xBacon.preco + (opcaoBaconExtra?.preco || 0) + (opcaoCheddarExtra?.preco || 0)) * 2 + batataFrita.preco + burger.taxa_entrega
            },
            historico_status: [
                { status: 'criado', data: umDiaAtras },
                { status: 'em_preparo', data: new Date(umDiaAtras.getTime() + 3 * 60 * 1000) },
                { status: 'a_caminho', data: new Date(umDiaAtras.getTime() + 20 * 60 * 1000) }
            ],
            createdAt: umDiaAtras
        },

        // Pedido 3: Dono1 pede sushi — Em preparo
        {
            cliente_id: dono1._id,
            restaurante_id: sushi._id,
            status: 'em_preparo',
            itens: [
                {
                    prato_id: comboKento._id,
                    prato_nome: comboKento.nome,
                    preco_unitario: comboKento.preco,
                    quantidade: 1,
                    adicionais: []
                },
                {
                    prato_id: salmaoNiguiri._id,
                    prato_nome: salmaoNiguiri.nome,
                    preco_unitario: salmaoNiguiri.preco,
                    quantidade: 2,
                    adicionais: []
                },
                {
                    prato_id: chaVerde._id,
                    prato_nome: chaVerde.nome,
                    preco_unitario: chaVerde.preco,
                    quantidade: 2,
                    adicionais: []
                }
            ],
            totais: {
                subtotal: comboKento.preco + (salmaoNiguiri.preco * 2) + (chaVerde.preco * 2),
                taxa_entrega: sushi.taxa_entrega,
                total: comboKento.preco + (salmaoNiguiri.preco * 2) + (chaVerde.preco * 2) + sushi.taxa_entrega
            },
            historico_status: [
                { status: 'criado', data: agora },
                { status: 'em_preparo', data: new Date(agora.getTime() + 2 * 60 * 1000) }
            ],
            createdAt: agora
        },

        // Pedido 4: Cliente pede pizza simples — Criado (aguardando)
        {
            cliente_id: cliente._id,
            restaurante_id: pizza._id,
            status: 'criado',
            itens: [
                {
                    prato_id: calabresa._id,
                    prato_nome: calabresa.nome,
                    preco_unitario: calabresa.preco,
                    quantidade: 2,
                    adicionais: opcaoGrande ? [
                        {
                            opcao_id: opcaoGrande._id,
                            opcao_nome: opcaoGrande.nome,
                            preco_unitario: opcaoGrande.preco,
                            quantidade: 1
                        }
                    ] : []
                }
            ],
            totais: {
                subtotal: (calabresa.preco + (opcaoGrande?.preco || 0)) * 2,
                taxa_entrega: pizza.taxa_entrega,
                total: (calabresa.preco + (opcaoGrande?.preco || 0)) * 2 + pizza.taxa_entrega
            },
            historico_status: [
                { status: 'criado', data: agora }
            ],
            createdAt: agora
        },

        // Pedido 5: Cliente pede burger — Cancelado
        {
            cliente_id: cliente._id,
            restaurante_id: burger._id,
            status: 'cancelado',
            itens: [
                {
                    prato_id: xBurger._id,
                    prato_nome: xBurger.nome,
                    preco_unitario: xBurger.preco,
                    quantidade: 1,
                    adicionais: []
                },
                {
                    prato_id: milkshake._id,
                    prato_nome: milkshake.nome,
                    preco_unitario: milkshake.preco,
                    quantidade: 1,
                    adicionais: []
                }
            ],
            totais: {
                subtotal: xBurger.preco + milkshake.preco,
                taxa_entrega: burger.taxa_entrega,
                total: xBurger.preco + milkshake.preco + burger.taxa_entrega
            },
            historico_status: [
                { status: 'criado', data: doisDiasAtras },
                { status: 'cancelado', data: new Date(doisDiasAtras.getTime() + 10 * 60 * 1000) }
            ],
            createdAt: doisDiasAtras
        }
    ];

    // Arredondar todos os totais para 2 casas decimais
    for (const pedido of pedidos) {
        pedido.totais.subtotal = Math.round(pedido.totais.subtotal * 100) / 100;
        pedido.totais.taxa_entrega = Math.round(pedido.totais.taxa_entrega * 100) / 100;
        pedido.totais.total = Math.round(pedido.totais.total * 100) / 100;
    }

    const created = await Pedido.insertMany(pedidos);

    console.log(`[SEED] ${created.length} pedidos criados.`);
    return created;
}

export default seedPedidos;
