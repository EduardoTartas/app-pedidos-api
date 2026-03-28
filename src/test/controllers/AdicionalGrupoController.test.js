import AdicionalGrupoController from '../../controllers/AdicionalGrupoController.js';
import AdicionalGrupoService from '../../service/AdicionalGrupoService.js';
import { CommonResponse, HttpStatusCodes, CustomError } from '../../utils/helpers/index.js';
import * as AdicionalSchema from '../../utils/validators/schemas/zod/AdicionalSchema.js';
import * as CommonQuerySchema from '../../utils/validators/schemas/zod/querys/CommonQuerySchema.js';

jest.mock('../../service/AdicionalGrupoService.js');
jest.mock('../../utils/helpers/index.js');
jest.mock('../../utils/validators/schemas/zod/AdicionalSchema.js');
jest.mock('../../utils/validators/schemas/zod/querys/CommonQuerySchema.js');

describe('AdicionalGrupoController', () => {
    let controller;
    let mockService;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();

        mockService = {
            listarPorPrato: jest.fn(),
            buscarPorID: jest.fn(),
            criar: jest.fn(),
            atualizar: jest.fn(),
            deletar: jest.fn(),
        };

        AdicionalGrupoService.mockImplementation(() => mockService);

        mockRequest = {
            params: {},
            body: {},
            user_id: 'user-123',
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        controller = new AdicionalGrupoController();

        CommonResponse.success = jest.fn();
        CommonResponse.created = jest.fn();

        AdicionalSchema.AdicionalGrupoSchema = {
            parse: jest.fn((data) => data),
        };

        AdicionalSchema.AdicionalGrupoUpdateSchema = {
            parse: jest.fn((data) => data),
        };

        CommonQuerySchema.IdSchema = {
            parse: jest.fn((data) => data),
        };
    });

    describe('listarPorPrato', () => {
        it('deve listar adicionais por prato com sucesso', async () => {
            const pratoId = 'prato-123';
            const mockData = [
                { id: '1', nome: 'Grupo 1', prato_id: pratoId },
                { id: '2', nome: 'Grupo 2', prato_id: pratoId },
            ];

            mockRequest.params = { pratoId };
            mockService.listarPorPrato.mockResolvedValue(mockData);

            await controller.listarPorPrato(mockRequest, mockResponse);

            expect(CommonQuerySchema.IdSchema.parse).toHaveBeenCalledWith(pratoId);
            expect(mockService.listarPorPrato).toHaveBeenCalledWith(pratoId);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockResponse, mockData);
        });

        it('deve lançar erro ao validar pratoId inválido', async () => {
            const error = new Error('ID inválido');
            CommonQuerySchema.IdSchema.parse.mockImplementation(() => {
                throw error;
            });

            mockRequest.params = { pratoId: 'invalid' };

            await expect(controller.listarPorPrato(mockRequest, mockResponse)).rejects.toThrow(error);
        });

        it('deve retornar vazio quando não há adicionais', async () => {
            const pratoId = 'prato-456';
            mockRequest.params = { pratoId };
            mockService.listarPorPrato.mockResolvedValue([]);

            await controller.listarPorPrato(mockRequest, mockResponse);

            expect(mockService.listarPorPrato).toHaveBeenCalledWith(pratoId);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockResponse, []);
        });
    });

    describe('buscarPorID', () => {
        it('deve buscar um adicional grupo por ID com sucesso', async () => {
            const id = 'grupo-123';
            const mockData = { id, nome: 'Grupo Premium', prato_id: 'prato-123' };

            mockRequest.params = { id };
            mockService.buscarPorID.mockResolvedValue(mockData);

            await controller.buscarPorID(mockRequest, mockResponse);

            expect(CommonQuerySchema.IdSchema.parse).toHaveBeenCalledWith(id);
            expect(mockService.buscarPorID).toHaveBeenCalledWith(id);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockResponse, mockData);
        });

        it('deve lançar erro ao buscar com ID inválido', async () => {
            const error = new Error('ID inválido');
            CommonQuerySchema.IdSchema.parse.mockImplementation(() => {
                throw error;
            });

            mockRequest.params = { id: 'invalid' };

            await expect(controller.buscarPorID(mockRequest, mockResponse)).rejects.toThrow(error);
        });
        
    it('deve retornar null quando ID não encontrado', async () => {
            const id = 'grupo-999';
            mockRequest.params = { id };
            mockService.buscarPorID.mockResolvedValue(null);

            await controller.buscarPorID(mockRequest, mockResponse);

            expect(mockService.buscarPorID).toHaveBeenCalledWith(id);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockResponse, null);
        });
    });

    describe('criar', () => {
        it('deve criar um novo grupo de adicional com sucesso', async () => {
            const pratoId = 'prato-123';
            const requestBody = {
                prato_id: pratoId,
                nome: 'Novo Grupo',
                descricao: 'Descrição do grupo',
            };

            const expectedServiceData = {
                nome: 'Novo Grupo',
                descricao: 'Descrição do grupo',
            };

            const mockData = {
                id: 'grupo-123',
                ...expectedServiceData,
                prato_id: pratoId,
            };

            mockRequest.body = requestBody;
            AdicionalSchema.AdicionalGrupoSchema.parse.mockReturnValue(requestBody);
            mockService.criar.mockResolvedValue(mockData);

            await controller.criar(mockRequest, mockResponse);

            expect(AdicionalSchema.AdicionalGrupoSchema.parse).toHaveBeenCalledWith(requestBody);
            expect(mockService.criar).toHaveBeenCalledWith(expectedServiceData, pratoId, mockRequest);
            expect(CommonResponse.created).toHaveBeenCalledWith(mockResponse, mockData);
        });

        it('deve lançar erro ao validar dados inválidos', async () => {
            const error = new Error('Dados inválidos');
            AdicionalSchema.AdicionalGrupoSchema.parse.mockImplementation(() => {
                throw error;
            });

            mockRequest.body = { nome: '' };

            await expect(controller.criar(mockRequest, mockResponse)).rejects.toThrow(error);
        });

        it('deve lançar erro quando grupo já existe', async () => {
            const requestBody = {
                prato_id: 'prato-123',
                nome: 'Grupo Existente',
            };

            const serviceError = new CustomError({
                statusCode: 409,
                errorType: 'resourceAlreadyExists',
                field: 'nome',
            });

            mockRequest.body = requestBody;
            AdicionalSchema.AdicionalGrupoSchema.parse.mockReturnValue(requestBody);
            mockService.criar.mockRejectedValue(serviceError);

            await expect(controller.criar(mockRequest, mockResponse)).rejects.toThrow(serviceError);
        });

        it('deve extrair prato_id corretamente do body', async () => {
            const requestBody = {
                prato_id: 'prato-456',
                nome: 'Grupo Test',
            };

            mockRequest.body = requestBody;
            AdicionalSchema.AdicionalGrupoSchema.parse.mockReturnValue(requestBody);
            mockService.criar.mockResolvedValue({});

            await controller.criar(mockRequest, mockResponse);

            const callArgs = mockService.criar.mock.calls[0];
            expect(callArgs[0]).toEqual({ nome: 'Grupo Test' });
            expect(callArgs[1]).toEqual('prato-456');
        });
    });

    describe('atualizar', () => {
        it('deve atualizar um grupo de adicional com sucesso', async () => {
            const id = 'grupo-123';
            const requestBody = {
                nome: 'Grupo Atualizado',
                descricao: 'Descrição atualizada',
            };

            const mockData = {
                id,
                ...requestBody,
            };

            mockRequest.params = { id };
            mockRequest.body = requestBody;
            AdicionalSchema.AdicionalGrupoUpdateSchema.parse.mockReturnValue(requestBody);
            mockService.atualizar.mockResolvedValue(mockData);

            await controller.atualizar(mockRequest, mockResponse);

            expect(CommonQuerySchema.IdSchema.parse).toHaveBeenCalledWith(id);
            expect(AdicionalSchema.AdicionalGrupoUpdateSchema.parse).toHaveBeenCalledWith(requestBody);
            expect(mockService.atualizar).toHaveBeenCalledWith(id, requestBody, mockRequest);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                mockResponse,
                mockData,
                HttpStatusCodes.OK.code,
                'Grupo de adicional atualizado com sucesso.'
            );
        });

        it('deve lançar erro ao validar ID inválido na atualização', async () => {
            const error = new Error('ID inválido');
            CommonQuerySchema.IdSchema.parse.mockImplementation(() => {
                throw error;
            });

            mockRequest.params = { id: 'invalid' };
            mockRequest.body = { nome: 'Test' };

            await expect(controller.atualizar(mockRequest, mockResponse)).rejects.toThrow(error);
        });

        it('deve lançar erro ao validar dados inválidos na atualização', async () => {
            const error = new Error('Dados inválidos');
            AdicionalSchema.AdicionalGrupoUpdateSchema.parse.mockImplementation(() => {
                throw error;
            });

            mockRequest.params = { id: 'grupo-123' };
            mockRequest.body = { nome: '' };

            await expect(controller.atualizar(mockRequest, mockResponse)).rejects.toThrow(error);
        });

        it('deve lançar erro quando grupo não encontrado na atualização', async () => {
            const id = 'grupo-999';
            const requestBody = { nome: 'Grupo' };

            const serviceError = new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
            });

            mockRequest.params = { id };
            mockRequest.body = requestBody;
            AdicionalSchema.AdicionalGrupoUpdateSchema.parse.mockReturnValue(requestBody);
            mockService.atualizar.mockRejectedValue(serviceError);

            await expect(controller.atualizar(mockRequest, mockResponse)).rejects.toThrow(serviceError);
        });
    });

    describe('deletar', () => {
        it('deve deletar um grupo de adicional com sucesso', async () => {
            const id = 'grupo-123';
            const mockData = { id, deletedAt: new Date() };

            mockRequest.params = { id };
            mockService.deletar.mockResolvedValue(mockData);

            await controller.deletar(mockRequest, mockResponse);

            expect(CommonQuerySchema.IdSchema.parse).toHaveBeenCalledWith(id);
            expect(mockService.deletar).toHaveBeenCalledWith(id, mockRequest);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                mockResponse,
                mockData,
                HttpStatusCodes.OK.code,
                'Grupo de adicional excluído com sucesso.'
            );
        });

        it('deve lançar erro ao validar ID inválido na deleção', async () => {
            const error = new Error('ID inválido');
            CommonQuerySchema.IdSchema.parse.mockImplementation(() => {
                throw error;
            });

            mockRequest.params = { id: 'invalid' };

            await expect(controller.deletar(mockRequest, mockResponse)).rejects.toThrow(error);
        });

        it('deve lançar erro quando grupo não encontrado na deleção', async () => {
            const id = 'grupo-999';

            const serviceError = new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
            });

            mockRequest.params = { id };
            mockService.deletar.mockRejectedValue(serviceError);

            await expect(controller.deletar(mockRequest, mockResponse)).rejects.toThrow(serviceError);
        });

        it('deve lançar erro quando usuário não tem permissão para deletar', async () => {
            const id = 'grupo-123';

            const serviceError = new CustomError({
                statusCode: 403,
                errorType: 'forbidden',
            });

            mockRequest.params = { id };
            mockService.deletar.mockRejectedValue(serviceError);

            await expect(controller.deletar(mockRequest, mockResponse)).rejects.toThrow(serviceError);
        });
    });

    describe('Testes de integração de fluxo', () => {
        it('deve criar e depois deletar um grupo', async () => {
            // Criar
            const createBody = {
                prato_id: 'prato-123',
                nome: 'Grupo Temp',
            };

            const createdGroup = {
                id: 'grupo-temp',
                nome: 'Grupo Temp',
            };

            mockRequest.body = createBody;
            mockRequest.params = {};
            AdicionalSchema.AdicionalGrupoSchema.parse.mockReturnValue(createBody);
            mockService.criar.mockResolvedValue(createdGroup);

            await controller.criar(mockRequest, mockResponse);

            expect(mockService.criar).toHaveBeenCalled();

            // Deletar
            mockRequest.params = { id: createdGroup.id };
            mockService.deletar.mockResolvedValue({ ...createdGroup, deletedAt: new Date() });

            await controller.deletar(mockRequest, mockResponse);

            expect(mockService.deletar).toHaveBeenCalledWith(createdGroup.id, mockRequest);
        });

        it('deve listar, buscar e atualizar um grupo', async () => {
            const pratoId = 'prato-123';
            const groupId = 'grupo-123';

            // Listar
            const groups = [
                { id: groupId, nome: 'Grupo Original', prato_id: pratoId },
            ];

            mockRequest.params = { pratoId };
            mockService.listarPorPrato.mockResolvedValue(groups);

            await controller.listarPorPrato(mockRequest, mockResponse);
            expect(mockService.listarPorPrato).toHaveBeenCalledWith(pratoId);

            // Buscar
            mockRequest.params = { id: groupId };
            mockService.buscarPorID.mockResolvedValue(groups[0]);

            await controller.buscarPorID(mockRequest, mockResponse);
            expect(mockService.buscarPorID).toHaveBeenCalledWith(groupId);

            // Atualizar
            const updateBody = { nome: 'Grupo Modificado' };
            mockRequest.params = { id: groupId };
            mockRequest.body = updateBody;
            AdicionalSchema.AdicionalGrupoUpdateSchema.parse.mockReturnValue(updateBody);
            mockService.atualizar.mockResolvedValue({ ...groups[0], ...updateBody });

            await controller.atualizar(mockRequest, mockResponse);
            expect(mockService.atualizar).toHaveBeenCalledWith(groupId, updateBody, mockRequest);
        });
    });
});
