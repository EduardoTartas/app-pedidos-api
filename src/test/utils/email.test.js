const mockSendMail = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../config/emailConfig.js', () => ({
    __esModule: true,
    default: {
        sendMail: (...args) => mockSendMail(...args),
    },
}));

jest.mock('../../utils/logger.js', () => ({
    __esModule: true,
    default: {
        info: (...args) => mockLoggerInfo(...args),
        error: (...args) => mockLoggerError(...args),
    },
}));

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import fs from 'fs';
import EmailService from '../../service/EmailService.js';

const originalEnv = { ...process.env };

beforeEach(() => {
    mockSendMail.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerError.mockReset();

    process.env.EMAIL_FROM = 'no-reply@test.local';
    process.env.EMAIL_USER = 'smtp@test.local';
    process.env.API_BASE_URL = 'http://api.test.local';
});

afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
});

describe('EmailService', () => {
    it('envia email de recuperacao com logo anexado quando o arquivo existe', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        mockSendMail.mockResolvedValue({ messageId: 'recovery-1' });

        await expect(EmailService.enviarEmailRecuperacao(
            'cliente@test.local',
            'token-recuperacao',
            'Cliente',
        )).resolves.toEqual({ messageId: 'recovery-1' });

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: 'no-reply@test.local',
            to: 'cliente@test.local',
            subject: expect.stringContaining('RanGo'),
            html: expect.stringContaining('token-recuperacao'),
            attachments: [expect.objectContaining({
                filename: 'logo-rango.png',
                cid: 'logoRango',
            })],
        }));
        expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('cliente@test.local'));
    });

    it('envia email de verificacao sem anexo quando o logo nao existe', async () => {
        delete process.env.EMAIL_FROM;
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        mockSendMail.mockResolvedValue({ messageId: 'verify-1' });

        await expect(EmailService.enviarEmailVerificacao(
            'cliente@test.local',
            'token-verificacao',
            'Cliente',
        )).resolves.toEqual({ messageId: 'verify-1' });

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: 'smtp@test.local',
            to: 'cliente@test.local',
            subject: expect.stringContaining('RanGo'),
            html: expect.stringContaining('http://api.test.local/verificar-email?token=token-verificacao'),
            attachments: [],
        }));
        expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('cliente@test.local'));
    });

    it('propaga falha ao enviar email de recuperacao', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        mockSendMail.mockRejectedValue(new Error('smtp indisponivel'));

        await expect(EmailService.enviarEmailRecuperacao(
            'cliente@test.local',
            'token',
            'Cliente',
        )).rejects.toThrow('smtp indisponivel');

        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('smtp indisponivel'));
    });

    it('propaga falha ao enviar email de verificacao', async () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        mockSendMail.mockRejectedValue(new Error('smtp fora'));

        await expect(EmailService.enviarEmailVerificacao(
            'cliente@test.local',
            'token',
            'Cliente',
        )).rejects.toThrow('smtp fora');

        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('smtp fora'));
    });
});
