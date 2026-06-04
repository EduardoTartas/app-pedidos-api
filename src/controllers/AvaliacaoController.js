import AvaliacaoService from '../service/AvaliacaoService.js';
import { AvaliacaoSchema } from '../utils/validators/schemas/zod/AvaliacaoSchema.js';
import { IdSchema } from '../utils/validators/schemas/zod/querys/CommonQuerySchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes
} from '../utils/helpers/index.js';

class AvaliacaoController {
    constructor() {
        this.service = new AvaliacaoService();
    }

    async listarPorRestaurante(req, res) {
        const { restauranteId } = req.params;
        IdSchema.parse(restauranteId);

        const data = await this.service.listarPorRestaurante(restauranteId, req);
        
        const totalDocs = data?.totalDocs ?? data?.docs?.length ?? 0;
        if (totalDocs === 0) {
            return CommonResponse.success(
                res,
                data,
                HttpStatusCodes.OK.code,
                'Nenhuma avaliação encontrada para este restaurante.'
            );
        }

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            `${totalDocs} avaliação(ões) encontrada(s).`
        );
    }
  async criar(req, res) {
        const parsedData = AvaliacaoSchema.parse(req.body);
        const data = await this.service.criar(parsedData, req);
        return CommonResponse.created(res, data);
    }

    async buscarPorId(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        const data = await this.service.buscarPorId(id);
        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            'Avaliação encontrada com sucesso.',
        );
    }

    async deletar(req, res) {
        const { id } = req.params;
        IdSchema.parse(id);

        await this.service.deletar(id, req);
        return CommonResponse.success(
            res,
            null,
            HttpStatusCodes.OK.code,
            'Avaliação excluída com sucesso.',
        );
    }
}

export default AvaliacaoController;