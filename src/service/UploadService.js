import { v4 as uuidv4 } from "uuid";
import path from "path";
import sharp from "sharp";
import UploadRepository from "../repository/UploadRepository.js";
import { CustomError } from "../utils/helpers/CustomError.js";
import { HttpStatusCodes } from "../utils/helpers/HttpStatusCodes.js";

class UploadService {
    constructor() {
        this.repository = new UploadRepository();
    }

    /**
     * Processa e faz upload de uma imagem com compressão aplicada usando Sharp.
     * Ideal para fotos de perfil, pratos e documentos.
     * @param {Object} file - Objeto de arquivo do Express (req.files.file).
     * @param {Object} options - Opções (width, height, quality, fit).
     */
    async processarImagem(file, options = {}) {
        if(!file) {
            throw new CustomError('Nenhum arquivo enviado.', HttpStatusCodes.BAD_REQUEST.code);
        }

        // Configurações padrão otimizadas para web
        const width = options.width;
        const height = options.height;
        const quality = options.quality || 80;
        const fit = options.fit || 'inside'; // 'cover' para recortar, 'inside' para conter

        // 1. Validação simples de extensão pela string
        const ext = path.extname(file.name).slice(1).toLowerCase();
        const validExts = ['jpg', 'jpeg', 'png', 'svg'];

        if(!validExts.includes(ext)) {
            throw new CustomError(`Extensão inválida (.${ext}). Permitido: ${validExts.join(', ')}.`, HttpStatusCodes.BAD_REQUEST.code);
        }

        // 2. Validação de tamanho bruto (max 50MB)
        const MAX_BYTES = 50 * 1024 * 1024;
        if(file.size > MAX_BYTES) {
            throw new CustomError(`Arquivo excede o tamanho máximo de ${MAX_BYTES / (1024 * 1024)}MB.`, HttpStatusCodes.BAD_REQUEST.code);
        }

        // 3. Gera nome único
        // Padroniza a saída para jpeg (exceto SVG) para consistência e compressão
        const finalExt = ext === 'svg' ? 'svg' : 'jpeg';
        const fileName = `${uuidv4()}.${finalExt}`;

        try {
            let buffer;
            let contentType;

            // 4. Processamento com Sharp
            if(ext !== 'svg') {
                const transformer = sharp(file.data);

                // Só redimensiona se passar width/height
                if(width || height) {
                    transformer.resize(width, height, {
                        fit: fit,
                        withoutEnlargement: true // Não aumenta imagem pequena se for menor
                    });
                }

                buffer = await transformer.jpeg({
                    quality,
                    progressive: true,
                    mozjpeg: true
                })
                .toBuffer();
                contentType = 'image/jpeg';
            } else {
                buffer = file.data;
                contentType = 'image/svg+xml';
            }

            // 5. Upload para Repository (ex: S3, local, etc)
            const url = await this.repository.uploadFile(buffer, fileName, contentType);

            return {
                url,
                fileName,
                metadata: {
                    originalName: file.name,
                    size: buffer.length,
                    contentType
                }
            };
        } catch (error) {
            console.error(`Erro no processamento/upload: ${error.message}`);
            throw new CustomError('Falha ao processar ou fazer upload do arquivo. Verifique se o arquivo é uma imagem válida.', HttpStatusCodes.INTERNAL_SERVER_ERROR.code);
        }
    }

    /**
     * Substitui uma imagem: faz upload da nova e deleta a antiga em background.
     * @param {Object} file - Arquivo novo.
     * @param {string|null} imagemAntigaUrl - URL ou nome da imagem antiga.
     * @param {Object} options - Opções de processamento.
     */
    async substituirImagem(file, imagemAntigaUrl, options = {}) {
        // 1. Upload da nova
        const resultado = await this.processarImagem(file, options);

        // 2. Deleta a antiga (se existir) com retry em background
        if (imagemAntigaUrl && imagemAntigaUrl.trim() !== "") {
            // Não aguarda o delete terminar (fire and forget)
            this.deleteImagemComRetry(imagemAntigaUrl).catch(err =>
                console.error(`Erro no processo de delete em background: ${err.message}`)
            );
        }

        return resultado;
    }

    /**
     * Deleta uma imagem com retry automático (exponential backoff).
     * @param {string} imagemUrl - URL ou nome da imagem.
     * @param {number} maxTentativas - Padrão: 3.
     */
    async deleteImagemComRetry(imagemUrl, maxTentativas = 3) {
        for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
            try {
                await this.deleteImagem(imagemUrl);
                return; // Sucesso
            } catch (error) {
                if (tentativa === maxTentativas) {
                    console.warn(`Falha ao deletar imagem antiga após ${maxTentativas} tentativas: ${imagemUrl}. Erro: ${error.message}`);
                } else {
                    const delayMs = Math.pow(2, tentativa - 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
    }

    /**
     * Deleta uma imagem (wrapper para o repository).
     * @param {string} fileNameOrUrl
     */
    async deleteImagem(fileNameOrUrl) {
        if (!fileNameOrUrl) return;
        await this.repository.deleteFile(fileNameOrUrl);
    }

    /**
     * Processa múltiplas imagens.
     * @param {Array} files
     * @param {Object} options
     */
    async processarMultiplasImagens(files, options = {}) {
        const filesArray = Array.isArray(files) ? files : [files];
        const resultados = [];

        for (const file of filesArray) {
            try {
                const res = await this.processarImagem(file, options);
                resultados.push(res);
            } catch (error) {
                // Rollback: deleta as já enviadas
                for (const { url } of resultados) {
                    await this.deleteImagem(url).catch(e => console.warn(`Erro no rollback de delete da imagem: ${e.message}`));
                }
                throw error;
            }
        }
        return resultados;
    }

    /**
     * Substitui múltiplas imagens.
     * @param {Array} files - Novos arquivos.
     * @param {Array} imagensAntigas - URLs antigas para remover.
     * @param {Object} options
     */
    async substituirMultiplasImagens(files, imagensAntigas = [], options = {}) {
        const resultados = await this.processarMultiplasImagens(files, options);

        const urls = resultados.map(r => r.url);

        // Deleta antigas em background
        if (imagensAntigas && imagensAntigas.length > 0) {
            imagensAntigas.forEach(url => {
                if(url) this.deleteImagemComRetry(url).catch(e => console.warn(`Erro delete background da imagem: ${e.message}`));
            });
        }

        return resultados;
    }
}

export default UploadService;
