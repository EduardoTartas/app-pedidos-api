import 'dotenv/config';
import Avaliacao from '../models/Avaliacao.js';
import Pedido from '../models/Pedido.js';
import DbConnect from '../config/dbConnect.js';

await DbConnect.conectar();

async function seedAvaliacoes() {
    await Avaliacao.deleteMany();

    // Busca apenas pedidos com status "entregue"
    const pedidosEntregues = await Pedido.find({ status: 'entregue' });

    if (pedidosEntregues.length === 0) {
        console.log('[SEED] Nenhum pedido entregue encontrado. Avaliações não criadas.');
        return [];
    }

    // Templates de descrições
    const descricoesPorNota = {
        5: [
            'Excelente! Comida fresca, bem embalada e entrega rápida. Muito bom mesmo!',
            'Perfeito! Recomendo fortemente. Voltarei com certeza.',
            'Ótima qualidade, excelente atendimento. Parabéns!',
            'Tudo perfeito! Comida quente, bem feita e muito saborosa.',
            'Simplesmente delicioso! Superou minhas expectativas.'
        ],
        4: [
            'Muito bom! Apenas a entrega foi um pouco mais lenta que o esperado.',
            'Adorei! Pequeno detalhe na embalagem, mas comida excelente.',
            'Ótimo custo-benefício. Produto de qualidade.',
            'Bom demais! Voltaria novamente com prazer.',
            'Satisfeito com a compra. Qualidade garantida.'
        ],
        3: [
            'Bom, mas esperava um pouco mais. Sem grandes reclamações.',
            'Atendeu bem, mas alguns itens poderiam ter melhor qualidade.',
            'Normal, nada de excepcional. Aceitável.',
            'Razoável. Nem bom, nem ruim.',
            'Gostei, mas há espaço para melhorias.'
        ],
        2: [
            'Decepcionante. Esperava mais pela descrição.',
            'Não gostei muito. Qualidade abaixo do esperado.',
            'Chegou frio. Não recomendo.',
            'Alguns itens vieram com problemas.',
            'Insatisfeito com qualidade. Esperava melhor.'
        ],
        1: [
            'Muito ruim. Não recomendo ninguém.',
            'Decepção total. Pior entrega que já tive.',
            'Qualidade horrível. Não voltarei mais.',
            'Inaceitável. Pedir reembolso.',
            'Péssima experiência. Totalmente desapontado.'
        ]
    };

}

export default seedAvaliacoes;
