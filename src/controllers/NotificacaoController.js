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
        try {
            const dadosValidados = NotificacaoSchema.parse(req.body);
            const data = await this.service.criar(dadosValidados);
            return CommonResponse.success(res, data, 201, 'Notificação criada com sucesso.');
        } catch (erro) {
            if (erro.name === 'ZodError') {
                throw new CustomError({
                    statusCode: 400,
                    errorType: 'validationError',
                    field: 'Notificação',
                    details: erro.errors,
                });
            }
            throw erro;
        }
    }

    async buscarPorId(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.buscarPorId(id);
        return CommonResponse.success(res, data);
    }

    async listarMinhas(req, res) {
        const data = await this.service.listarMinhasNotificacoes(req);
        return CommonResponse.success(res, data);
    }

    async marcarComoLida(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.marcarComoLida(id, req);
        return CommonResponse.success(res, data, 200, 'Notificação marcada como lida.');
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        await this.service.deletar(id, req);
        return CommonResponse.success(res, null, 204, 'Notificação deletada com sucesso.');
    }
}

export default NotificacaoController;