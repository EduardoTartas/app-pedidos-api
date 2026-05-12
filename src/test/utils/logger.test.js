import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Logger } from '../../utils/logger.js';

const originalEnv = { ...process.env };
const originalLoggerListenersSet = global.loggerListenersSet;

let tempDirs = [];

function criarTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-pedidos-logger-'));
    tempDirs.push(dir);
    return dir;
}

beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.LOG_ENABLED = 'false';
    delete process.env.LOG_MAX_SIZE_GB;
    delete process.env.LOG_LEVEL;
    global.loggerListenersSet = false;
});

afterEach(() => {
    for (const dir of tempDirs) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];

    process.env = { ...originalEnv };
    global.loggerListenersSet = originalLoggerListenersSet;
    jest.restoreAllMocks();
});

describe('Logger', () => {
    it('cria logger desabilitado sem transports e valores padrao', () => {
        const logger = new Logger();

        expect(logger.logEnabled).toBe(false);
        expect(logger.logMaxSizeGB).toBe(50);
        expect(logger.maxLogSize).toBe(50 * 1024 * 1024 * 1024);
        expect(logger.logger.transports).toHaveLength(0);
    });

    it('usa variaveis de ambiente para tamanho, nivel e habilitacao', () => {
        process.env.LOG_ENABLED = 'true';
        process.env.LOG_MAX_SIZE_GB = '0.001';
        process.env.LOG_LEVEL = 'debug';

        const logger = new Logger();

        expect(logger.logEnabled).toBe(true);
        expect(logger.logMaxSizeGB).toBe(0.001);
        expect(logger.logger.level).toBe('debug');
        expect(logger.logger.transports.length).toBeGreaterThan(0);
    });

    it('rejeita tamanho maximo invalido', () => {
        process.env.LOG_MAX_SIZE_GB = '0';

        expect(() => new Logger()).toThrow('LOG_MAX_SIZE_GB');
    });

    it('calcula tamanho total de logs e retorna zero para diretorio ausente', () => {
        const logger = new Logger();
        const dir = criarTempDir();
        fs.writeFileSync(path.join(dir, 'a.log'), '12345');
        fs.writeFileSync(path.join(dir, 'b.log'), '123');

        expect(logger.getTotalLogSize(path.join(dir, 'ausente'))).toBe(0);
        expect(logger.getTotalLogSize(dir)).toBe(8);
    });

    it('remove arquivos antigos ate respeitar o limite', async () => {
        const logger = new Logger();
        const dir = criarTempDir();
        const antigo = path.join(dir, 'antigo.log');
        const novo = path.join(dir, 'novo.log');

        fs.writeFileSync(antigo, '12345');
        await new Promise(resolve => setTimeout(resolve, 5));
        fs.writeFileSync(novo, '12345');

        logger.ensureLogSizeLimit(dir, 5);

        expect(fs.existsSync(antigo)).toBe(false);
        expect(fs.existsSync(novo)).toBe(true);
    });

    it('nao remove arquivos quando o limite ja esta respeitado', () => {
        const logger = new Logger();
        const dir = criarTempDir();
        const file = path.join(dir, 'ok.log');
        fs.writeFileSync(file, '12345');

        logger.ensureLogSizeLimit(dir, 10);

        expect(fs.existsSync(file)).toBe(true);
    });

    it('registra handlers e inicia intervalo fora do ambiente de teste', () => {
        process.env.NODE_ENV = 'production';
        process.env.LOG_ENABLED = 'true';

        const onSpy = jest.spyOn(process, 'on').mockImplementation(() => process);
        const setIntervalSpy = jest
            .spyOn(global, 'setInterval')
            .mockImplementation((callback) => {
                callback();
                return 123;
            });

        const logger = new Logger();

        expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
        expect(global.loggerListenersSet).toBe(true);
        expect(setIntervalSpy).toHaveBeenCalled();
        expect(logger.logIntervalId).toBe(123);
    });

    it('nao registra handlers novamente quando ja foram configurados', () => {
        process.env.NODE_ENV = 'production';
        process.env.LOG_ENABLED = 'true';
        global.loggerListenersSet = true;

        const onSpy = jest.spyOn(process, 'on').mockImplementation(() => process);
        jest.spyOn(global, 'setInterval').mockImplementation(() => 123);

        new Logger();

        expect(onSpy).not.toHaveBeenCalledWith('uncaughtException', expect.any(Function));
        expect(onSpy).not.toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });
});
