// src/service/EnderecoService.js

import {
  CustomError,
  HttpStatusCodes,
  messages,
  ensurePermission,
} from '../utils/helpers/index.js';
import EnderecoRepository from '../repository/EnderecoRepository.js';
import UsuarioRepository from '../repository/UsuarioRepository.js';
import RestauranteRepository from '../repository/RestauranteRepository.js';

class EnderecoService {
  constructor() {
    this.repository = new EnderecoRepository();
    this.usuarioRepository = new UsuarioRepository();
    this.restauranteRepository = new RestauranteRepository();
  }

  // === Endereços de Usuário ===

  async listarPorUsuario(usuarioId, req) {
    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    ensurePermission({
      usuarioLogado,
      targetId: usuarioId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para ver os endereços deste usuário.',
    });

    return await this.repository.listarPorUsuario(usuarioId);
  }

  async criarParaUsuario(usuarioId, parsedData, req) {
    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    ensurePermission({
      usuarioLogado,
      targetId: usuarioId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para adicionar endereços a este usuário.',
    });

    await this.ensureUsuarioExists(usuarioId);

    // Se marcado como principal, desmarcar os outros
    if (parsedData.principal) {
      await this.repository.desmarcarPrincipal(usuarioId);
    }

    parsedData.usuario_id = usuarioId;
    parsedData.restaurante_id = null;

    return await this.repository.criar(parsedData);
  }

  async atualizarDeUsuario(usuarioId, enderecoId, parsedData, req) {
    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    ensurePermission({
      usuarioLogado,
      targetId: usuarioId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para editar endereços deste usuário.',
    });

    const endereco = await this.ensureEnderecoExists(enderecoId);
    this.ensureEnderecoPertence(endereco, 'usuario_id', usuarioId);

    // Se marcado como principal, desmarcar os outros
    if (parsedData.principal) {
      await this.repository.desmarcarPrincipal(usuarioId);
    }

    // Não permitir alterar o vínculo
    delete parsedData.usuario_id;
    delete parsedData.restaurante_id;

    return await this.repository.atualizar(enderecoId, parsedData);
  }

  async deletarDeUsuario(usuarioId, enderecoId, req) {
    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    ensurePermission({
      usuarioLogado,
      targetId: usuarioId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para remover endereços deste usuário.',
    });

    const endereco = await this.ensureEnderecoExists(enderecoId);
    this.ensureEnderecoPertence(endereco, 'usuario_id', usuarioId);

    return await this.repository.deletar(enderecoId);
  }

  // === Endereço de Restaurante ===

  async buscarPorRestaurante(restauranteId) {
    const endereco = await this.repository.buscarPorRestaurante(restauranteId);
    return endereco;
  }

  async criarParaRestaurante(restauranteId, parsedData, req) {
    const restaurante = await this.ensureRestauranteExists(restauranteId);

    // Verificar permissão (dono ou admin)
    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
    ensurePermission({
      usuarioLogado,
      targetId: donoId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para adicionar endereço a este restaurante.',
    });

    // Verificar se já existe um endereço para este restaurante
    const enderecoExistente =
      await this.repository.buscarPorRestaurante(restauranteId);
    if (enderecoExistente) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'duplicateEntry',
        field: 'Endereço',
        details: [
          {
            path: 'restaurante_id',
            message: 'Este restaurante já possui um endereço cadastrado.',
          },
        ],
        customMessage:
          'Este restaurante já possui um endereço cadastrado. Use a rota de atualização.',
      });
    }

    parsedData.restaurante_id = restauranteId;
    parsedData.usuario_id = null;
    parsedData.principal = false;

    return await this.repository.criar(parsedData);
  }

  async atualizarDeRestaurante(restauranteId, enderecoId, parsedData, req) {
    const restaurante = await this.ensureRestauranteExists(restauranteId);

    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
    ensurePermission({
      usuarioLogado,
      targetId: donoId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para editar o endereço deste restaurante.',
    });

    const endereco = await this.ensureEnderecoExists(enderecoId);
    this.ensureEnderecoPertence(endereco, 'restaurante_id', restauranteId);

    // Não permitir alterar o vínculo
    delete parsedData.usuario_id;
    delete parsedData.restaurante_id;
    delete parsedData.principal;

    return await this.repository.atualizar(enderecoId, parsedData);
  }

  async deletarDeRestaurante(restauranteId, enderecoId, req) {
    const restaurante = await this.ensureRestauranteExists(restauranteId);

    const usuarioLogado = await this.ensureUsuarioExists(req.user_id);
    const donoId = String(restaurante.dono_id._id || restaurante.dono_id);
    ensurePermission({
      usuarioLogado,
      targetId: donoId,
      field: 'Endereço',
      customMessage:
        'Você não tem permissão para remover o endereço deste restaurante.',
    });

    const endereco = await this.ensureEnderecoExists(enderecoId);
    this.ensureEnderecoPertence(endereco, 'restaurante_id', restauranteId);

    return await this.repository.deletar(enderecoId);
  }

  // === Métodos auxiliares ===

  async ensureEnderecoExists(id) {
    const endereco = await this.repository.buscarPorID(id);
    if (!endereco) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Endereço',
        details: [],
        customMessage: messages.error.resourceNotFound('Endereço'),
      });
    }
    return endereco;
  }

  async ensureUsuarioExists(userId) {
    const usuario = await this.usuarioRepository.buscarPorID(userId);
    if (!usuario) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Usuário',
        details: [],
        customMessage: messages.error.resourceNotFound('Usuário'),
      });
    }
    return usuario;
  }

  async ensureRestauranteExists(id) {
    const restaurante = await this.restauranteRepository.buscarPorID(id);
    if (!restaurante) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Restaurante',
        details: [],
        customMessage: messages.error.resourceNotFound('Restaurante'),
      });
    }
    return restaurante;
  }

  ensureEnderecoPertence(endereco, campo, id) {
    const enderecoRef = String(endereco[campo]?._id || endereco[campo]);
    if (enderecoRef !== String(id)) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'permissionError',
        field: 'Endereço',
        details: [],
        customMessage: 'Este endereço não pertence ao recurso informado.',
      });
    }
  }
}

export default EnderecoService;
