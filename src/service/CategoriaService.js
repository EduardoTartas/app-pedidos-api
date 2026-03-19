// src/service/CategoriaService.js

import {
    CustomError,
    ensurePermission,
    HttpStatusCodes,
    messages
} from '../utils/helpers/index.js';
import CategoriaRepository from '../repository/CategoriaRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import UploadService from './UploadService.js';

class CategoriaService {
    constructor() {
        this.repository = new CategoriaRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.uploadService = new UploadService();
    }

    //TODO: VALIDAÇÃO DE PERMISSÃO PARA SOMENTE ADMINISTRADORES PODEREM GERENCIAR CATEGORIAS!!!
    async listar(req) {
        const data = await this.repository.listar(req);
        return data;
    }

    async criar(parsedData) {
        await this.validarNome(parsedData.nome);
        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData) {
        await this.ensureCategoriaExists(id);
        if (parsedData.nome) {
            await this.validarNome(parsedData.nome, id);
        }
        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id) {
        await this.ensureCategoriaExists(id);
        const data = await this.repository.deletar(id);
        return data;
    }

    async ensureCategoriaExists(id) {
        const categoriaExistente = await this.repository.buscarPorID(id);
        if (!categoriaExistente) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: messages.error.resourceNotFound('Categoria'),
            });
        }
        return categoriaExistente;
    }

    async validarNome(nome, id = null) {
        const categoriaExistente = await this.repository.buscarPorNome(nome, id);
        if (categoriaExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'nome',
                details: [{ path: 'nome', message: 'Nome já está em uso.' }],
                customMessage: 'O nome informado já está sendo utilizado por outra categoria.',
            });
        }
    }

    // ================================
    // UPLOAD DE FOTO
    // ================================
    async fotoUpload(id, file, req) {
      const categoria = await this.repository.buscarPorID(id);

        if (!categoria) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: 'Categoria não encontrada.',
            });
        }

        // Validar se usuário Logado é admin, caso contrário, lançar erro de permissão
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const isAdmin = usuarioLogado ? usuarioLogado.isAdmin : false;

        if (!isAdmin) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'forbidden',
                field: 'Categoria',
                details: [],
                customMessage: 'Você não tem permissões para alterar os ícones de categorias.',
            });
        }

        // O 'substituirImagem' já trata se 'categoria.icone_categoria' for null ou se não existir
        const uploadResult = await this.uploadService.substituirImagem(
            file,
            categoria.icone_categoria,
            { fit: 'cover', quality: 80 }
        );

        // Atualiza a URL no banco de dados
        await this.repository.atualizar(id, { icone_categoria: uploadResult.url });

        return uploadResult;
    }

    async fotoDelete(id, req) {
        const categoria = await this.repository.buscarPorID(id);

        if (!categoria) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: 'Categoria não encontrada.',
            });
        }

        // Validar se usuário Logado é admin, caso contrário, lançar erro de permissão
        const usuarioLogado = await this.usuarioRepository.buscarPorID(req.user_id);
        const isAdmin = usuarioLogado ? usuarioLogado.isAdmin : false;

        if (!isAdmin) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'forbidden',
                field: 'Categoria',
                details: [],
                customMessage: 'Você não tem permissões para excluir os ícones de categorias.',
            });
        }

        if (!categoria.icone_categoria) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Categoria',
                details: [],
                customMessage: 'Esta categoria não possui um ícone para ser removido.',
            });
        }

        const urlAntiga = categoria.icone_categoria;

      // 1. Remove a URL do banco de dados imediatamente (resposta rápida, evita carregamento desnecessário do ícone)
      await this.repository.atualizar(id, { icone_categoria: "" });

      // 2. Deleta do Garage em background com retry (se falhar, apenas loga e não impacta o usuário)
      this.uploadService.deleteImagemComRetry(urlAntiga).catch(err => {
          console.error(`Erro isolado na exclusão do ícone em background: ${err.message}`);
      });

      return true;
    }
}

export default CategoriaService;
