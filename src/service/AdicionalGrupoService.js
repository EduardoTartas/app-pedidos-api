// src/service/AdicionalGrupoService.js

import {
    CustomError,
    HttpStatusCodes,
    ensurePermission
} from '../utils/helpers/index.js';
import AdicionalGrupoRepository from '../repository/AdicionalGrupoRepository.js';
import AdicionalOpcaoRepository from '../repository/AdicionalOpcaoRepository.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import PratoRepository from '../repository/PratoRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';

class AdicionalGrupoService {
    constructor() {
        this.grupoRepository = new AdicionalGrupoRepository();
        this.opcaoRepository = new AdicionalOpcaoRepository();
        this.restauranteRepository = new RestauranteRepository();
        this.pratoRepository = new PratoRepository();
        this.usuarioRepository = new UsuarioRepository();
    }

    async criar(parsedData, pratoId, req) {
        const prato = await this.pratoRepository.buscarPorID(pratoId);
        const restaurante = await this.restauranteRepository.buscarPorID(prato.restaurante_id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para gerenciar adicionais deste restaurante.',
        });

        const nomeExistente = await this.grupoRepository.buscarPorNomeEntreIds(parsedData.nome, prato.adicionais_grupo_ids);
        if (nomeExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'resourceAlreadyExists',
                field: 'nome',
                details: [],
                customMessage: 'Já existe um grupo de adicionais com este nome neste prato.',
            });
        }

        // L-03: Validar max >= min no service (defense in depth)
        if (parsedData.max !== undefined && parsedData.min !== undefined && parsedData.max < parsedData.min) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'max',
                details: [],
                customMessage: `O valor máximo (${parsedData.max}) não pode ser menor que o mínimo (${parsedData.min}).`,
            });
        }

        parsedData.restaurante_id = prato.restaurante_id;

        const grupo = await this.grupoRepository.criar(parsedData);

        // Vincular grupo ao prato
        prato.adicionais_grupo_ids.push(grupo._id);
        await this.pratoRepository.atualizar(pratoId, { adicionais_grupo_ids: prato.adicionais_grupo_ids });

        return grupo;
    }

    async buscarPorID(id) {
        const data = await this.grupoRepository.buscarPorID(id);
        return data;
    }

    async listarPorPrato(pratoId) {
        const prato = await this.pratoRepository.buscarPorID(pratoId);
        const data = await this.grupoRepository.listarPorIds(prato.adicionais_grupo_ids);
        return data;
    }

    async atualizar(id, parsedData, req) {
        const grupo = await this.grupoRepository.buscarPorID(id);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para editar adicionais deste restaurante.',
        });

        // L-03: Validar max >= min considerando valores atuais do grupo
        const novoMin = parsedData.min !== undefined ? parsedData.min : grupo.min;
        const novoMax = parsedData.max !== undefined ? parsedData.max : grupo.max;
        if (novoMax < novoMin) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'max',
                details: [],
                customMessage: `O valor máximo (${novoMax}) não pode ser menor que o mínimo (${novoMin}).`,
            });
        }

        const data = await this.grupoRepository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id, req) {
        const grupo = await this.grupoRepository.buscarPorID(id);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para excluir adicionais deste restaurante.',
        });

        await this.opcaoRepository.deletarPorGrupo(id);
        const data = await this.grupoRepository.deletar(id);

        // L-10: Sempre buscar e desvincular o grupo de todos os pratos que o referenciam
        const Prato = (await import('../models/Prato.js')).default;
        await Prato.updateMany(
            { adicionais_grupo_ids: id },
            { $pull: { adicionais_grupo_ids: id } }
        );

        return data;
    }
}

export default AdicionalGrupoService;
