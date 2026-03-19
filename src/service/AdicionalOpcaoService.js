// src/service/AdicionalOpcaoService.js

import { CustomError, HttpStatusCodes, ensurePermission } from '../utils/helpers/index.js';
import AdicionalOpcaoRepository from '../repository/AdicionalOpcaoRepository.js';
import AdicionalGrupoRepository from '../repository/AdicionalGrupoRepository.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import UploadService from './UploadService.js';

class AdicionalOpcaoService {
    constructor() {
        this.opcaoRepository = new AdicionalOpcaoRepository();
        this.grupoRepository = new AdicionalGrupoRepository();
        this.restauranteRepository = new RestauranteRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.uploadService = new UploadService();
    }

    async criar(parsedData, req) {
        const grupoId = parsedData.grupo_id;
        const grupo = await this.grupoRepository.buscarPorID(grupoId);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para gerenciar adicionais deste restaurante.',
        });

        const nomeExistente = await this.opcaoRepository.buscarPorNomeNoGrupo(parsedData.nome, grupoId);
        if (nomeExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'resourceAlreadyExists',
                field: 'nome',
                details: [],
                customMessage: 'Já existe uma opção de adicional com este nome neste grupo.',
            });
        }

        const opcao = await this.opcaoRepository.criar(parsedData);
        return opcao;
    }

    async listar(grupoId) {
        await this.grupoRepository.buscarPorID(grupoId);
        const data = await this.opcaoRepository.listarPorGrupo(grupoId);
        return data;
    }

    async atualizar(id, parsedData, req) {
        const opcao = await this.opcaoRepository.buscarPorID(id);
        const grupo = await this.grupoRepository.buscarPorID(opcao.grupo_id);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para editar adicionais deste restaurante.',
        });

        if (parsedData.nome) {
            const nomeExistente = await this.opcaoRepository.buscarPorNomeNoGrupo(parsedData.nome, opcao.grupo_id, id);
            if (nomeExistente) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.CONFLICT.code,
                    errorType: 'resourceAlreadyExists',
                    field: 'nome',
                    details: [],
                    customMessage: 'Já existe uma opção de adicional com este nome neste grupo.',
                });
            }
        }

        const data = await this.opcaoRepository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id, req) {
        const opcao = await this.opcaoRepository.buscarPorID(id);
        const grupo = await this.grupoRepository.buscarPorID(opcao.grupo_id);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para excluir adicionais deste restaurante.',
        });

        const data = await this.opcaoRepository.deletar(id);
        return data;
    }

    // ================================
    // UPLOAD DE FOTO
    // ================================
    async fotoUpload(id, file, req) {
        const opcao = await this.opcaoRepository.buscarPorID(id);

        if (!opcao) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Adicional',
                details: [],
                customMessage: 'Opção de adicional não encontrada.',
            });
        }

        const grupo = await this.grupoRepository.buscarPorID(opcao.grupo_id);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para fazer upload de foto deste adicional.',
        });

        // O 'substituirImagem' já trata se 'adicional.foto_adicional' for null ou se não existir
        const uploadResult = await this.uploadService.substituirImagem(
            file,
            opcao.foto_adicional,
            { width: 800, height: 800, fit: 'cover', quality: 80 },
        );

        // Atualiza a URL no banco de dados
        await this.opcaoRepository.atualizar(id, { foto_adicional: uploadResult.url });

        return uploadResult;
    }

    async fotoDelete(id, req) {
        const opcao = await this.opcaoRepository.buscarPorID(id);

        if(!opcao) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Adicional',
                details: [],
                customMessage: 'Opção de adicional não encontrada.',
            });
        }

        const grupo = await this.grupoRepository.buscarPorID(opcao.grupo_id);
        const restaurante = await this.restauranteRepository.buscarPorID(grupo.restaurante_id);

        // Verificar se o usuário é o dono ou admin
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
        ensurePermission({
            usuarioLogado,
            targetId: donoId,
            field: 'Adicional',
            customMessage: 'Você não tem permissões para excluir a foto deste adicional.',
        });

        if(!opcao.foto_adicional) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'invalidRequest',
                field: 'Adicional',
                details: [],
                customMessage: 'Este adicional não possui uma foto para remover.',
            });
        }

        const urlAntiga = opcao.foto_adicional;

        // 1. Remove a URL do banco de dados imediatamente (resposta rápida, evita carregamento desnecessário da imagem)
        await this.opcaoRepository.atualizar(id, { foto_adicional: "" });

        // 2. Deleta do Garage em background com retry (se falhar, apenas loga e não impacta o usuário)
        this.uploadService.deleteImagemComRetry(urlAntiga).catch(err => {
            console.error(`Erro isolado na exclusão da foto em background: ${err.message}`);
        });

        return true;
    }
}

export default AdicionalOpcaoService;
