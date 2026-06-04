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

    async criar(dadosGrupo, targetId, req, ePrato = true) {
        let restauranteId;
        let prato;

        if (ePrato) {
            prato = await this.pratoRepository.buscarPorID(targetId);
            restauranteId = prato.restaurante_id;
        } else {
            restauranteId = targetId;
        }

        const restaurante = await this.restauranteRepository.buscarPorID(restauranteId);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para gerenciar adicionais deste restaurante.',
        });

        // Verificar duplicidade no restaurante (não apenas no prato)
        const gruposExistentes = await this.grupoRepository.listarPorRestaurante(restauranteId);
        const nomeExistente = gruposExistentes.find(g => g.nome.toLowerCase() === dadosGrupo.nome.toLowerCase());

        if (nomeExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'resourceAlreadyExists',
                field: 'nome',
                details: [],
                customMessage: 'Já existe um grupo de adicionais com este nome neste restaurante.',
            });
        }

        // Validar max >= min no service (defense in depth)
        if (dadosGrupo.max !== undefined && dadosGrupo.min !== undefined && dadosGrupo.max < dadosGrupo.min) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'max',
                details: [],
                customMessage: `O valor máximo (${dadosGrupo.max}) não pode ser menor que o mínimo (${dadosGrupo.min}).`,
            });
        }

        dadosGrupo.restaurante_id = restauranteId;

        const grupo = await this.grupoRepository.criar(dadosGrupo);

        // Vincular grupo ao prato (apenas se foi criado via fluxo de prato)
        if (ePrato && prato) {
            prato.adicionais_grupo_ids.push(grupo._id);
            await this.pratoRepository.atualizar(targetId, { adicionais_grupo_ids: prato.adicionais_grupo_ids });
        }

        return grupo;
    }

    async buscarPorID(id) {
        const data = await this.grupoRepository.buscarPorID(id);
        return data;
    }

    async listarPorPrato(pratoId) {
        const prato = await this.pratoRepository.buscarPorID(pratoId);

        // Se já vier populado (o que acontece no repository), extrai os IDs
        const ids = (prato.adicionais_grupo_ids || []).map(g =>
            typeof g === 'object' && g._id ? g._id : g
        );

        const data = await this.grupoRepository.listarPorIds(ids);
        return data;
    }

    async listarPorRestaurante(restauranteId) {
        return await this.grupoRepository.listarPorRestaurante(restauranteId);
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
