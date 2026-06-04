import 'dotenv/config';
import Notificacao from '../models/Notificacao.js';
import Usuario from '../models/Usuario.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedNotificacoes() {
    await Notificacao.deleteMany();

    // Buscar usuários existentes
    const usuarios = await Usuario.find({}, '_id email');
    const usuarioMap = {};
    usuarios.forEach(u => {
        usuarioMap[u.email] = u._id;
    });

    const notificacoes = [
        // Notificações para o cliente
        {
            usuario_id: usuarioMap['cliente@delivery.com'],
            tipo: 'pedido_confirmado',
            titulo: 'Pedido Confirmado!',
            mensagem: 'Seu pedido #12345 foi confirmado pelo restaurante.',
            lida: false,
            pedido_id: null // Simulando pedido
        },
        {
            usuario_id: usuarioMap['cliente@delivery.com'],
            tipo: 'em_preparo',
            titulo: 'Pedido em Preparo',
            mensagem: 'Seu pedido #12345 está sendo preparado.',
            lida: true,
            lida_em: new Date('2025-01-15T10:00:00Z'),
            pedido_id: null
        },
        {
            usuario_id: usuarioMap['cliente@delivery.com'],
            tipo: 'a_caminho',
            titulo: 'Pedido a Caminho!',
            mensagem: 'Seu pedido #12345 está a caminho.',
            lida: false,
            pedido_id: null
        },
        {
            usuario_id: usuarioMap['cliente@delivery.com'],
            tipo: 'entregue',
            titulo: 'Pedido Entregue',
            mensagem: 'Seu pedido #12345 foi entregue com sucesso!',
            lida: false,
            pedido_id: null
        },
        {
            usuario_id: usuarioMap['dono1@delivery.com'],
            tipo: 'geral',
            titulo: 'Bem-vindo ao Sistema!',
            mensagem: 'Seu restaurante foi aprovado e está ativo na plataforma.',
            lida: true,
            lida_em: new Date('2025-01-10T09:00:00Z'),
            pedido_id: null
        },
        {
            usuario_id: usuarioMap['dono1@delivery.com'],
            tipo: 'pedido_confirmado',
            titulo: 'Novo Pedido!',
            mensagem: 'Você recebeu um novo pedido #12346.',
            lida: false,
            pedido_id: null
        },
        {
            usuario_id: usuarioMap['admin@delivery.com'],
            tipo: 'geral',
            titulo: 'Sistema Atualizado',
            mensagem: 'O sistema foi atualizado com novas funcionalidades.',
            lida: false,
            pedido_id: null
        }
    ];

    const created = await Notificacao.insertMany(notificacoes);
    console.log(`[SEED] ${created.length} notificações criadas.`);
    return created;
}

export default seedNotificacoes;