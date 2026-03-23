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

    // Distribui avaliações com notas variadas
    // 40% - 5 estrelas (excelente)
    // 35% - 4 estrelas (muito bom)
    // 15% - 3 estrelas (bom)
    // 7%  - 2 estrelas (ruim)
    // 3%  - 1 estrela (péssimo)

    const avaliacoes = pedidosEntregues.map((pedido, index) => {
        let nota;
        const percentual = (index / pedidosEntregues.length) * 100;

        if (percentual < 40) {
            nota = 5;
        } else if (percentual < 75) {
            nota = 4;
        } else if (percentual < 90) {
            nota = 3;
        } else if (percentual < 97) {
            nota = 2;
        } else {
            nota = 1;
        }

        const descricoes = descricoesPorNota[nota];
        const descricao = descricoes[Math.floor(Math.random() * descricoes.length)];

        return {
            pedido_id: pedido._id,
            cliente_id: pedido.cliente_id,
            restaurante_id: pedido.restaurante_id,
            nota,
            descricao
        };
    });

    const created = await Avaliacao.insertMany(avaliacoes);
    console.log(`[SEED] ${created.length} avaliações criadas a partir de pedidos entregues.`);
    console.log(`[SEED] Distribuição: ${Math.ceil(created.length * 0.40)} ⭐⭐⭐⭐⭐, ${Math.ceil(created.length * 0.35)} ⭐⭐⭐⭐, ${Math.ceil(created.length * 0.15)} ⭐⭐⭐, ${Math.ceil(created.length * 0.07)} ⭐⭐, ${Math.ceil(created.length * 0.03)} ⭐`);
    return created;
}

export default seedAvaliacoes;
