import NotificacaoService from '../service/NotificacaoService.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import { NotificacaoSchema, NotificacaoUpdateSchema } from '../utils/validators/schemas/zod/NotificacaoSchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class NotificacaoController {
    constructor() {
        this.service = new NotificacaoService();
    }

    async criar(req, res) {
        const dadosValidados = NotificacaoSchema.parse(req.body);
        const data = await this.service.criar(dadosValidados);
        return CommonResponse.success(res, data, HttpStatusCodes.CREATED.code, 'Notificação criada com sucesso.');
    }

    async buscarPorId(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.buscarPorId(id, req);
        return CommonResponse.success(res, data);
    }

    async listarMinhas(req, res) {
        const query = req?.query || {};
        const data = await this.service.listarMinhasNotificacoes(req);
        
        const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
        if (totalDocs === 0) {
            const temFiltros = query && (query.lida !== undefined || query.tipo);
            const mensagem = temFiltros
                ? 'Nenhuma notificação encontrada com os filtros informados.'
                : 'Nenhuma notificação encontrada.';
            return CommonResponse.success(
                res,
                data,
                HttpStatusCodes.OK.code,
                mensagem
            );
        }

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            `${totalDocs} notificação(ões) encontrada(s).`
        );
    }

    async marcarComoLida(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.marcarComoLida(id, req);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, 'Notificação marcada como lida.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        await this.service.deletar(id, req);
        return CommonResponse.success(res, null, HttpStatusCodes.OK.code, 'Notificação deletada com sucesso.');
    }
}

export default NotificacaoController;
