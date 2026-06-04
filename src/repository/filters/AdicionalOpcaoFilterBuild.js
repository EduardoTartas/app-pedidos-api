import mongoose from "mongoose";

class AdicionalOpcaoFilterBuild {
    constructor() {
        this.filtros = {};
    }

    comGrupoId(grupoId) {
        if (grupoId) {
            try {
                this.filtros.grupo_id = new mongoose.Types.ObjectId(grupoId);
            } catch (error) {
                // ID invalido, nao adiciona ao filtro.
            }
        }
        return this;
    }

        comNome(nome) {
        if (nome) {
            const normalizeString = (str) => {
                return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            };
            const normalizedNome = normalizeString(nome);
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = escapeRegex(normalizedNome).replace(/a/g, '[aàáâãäå]')
                                                        .replace(/e/g, '[eèéêë]')
                                                        .replace(/i/g, '[iìíîï]')
                                                        .replace(/o/g, '[oòóôõö]')
                                                        .replace(/u/g, '[uùúûü]')
                                                        .replace(/c/g, '[cç]')
                                                        .replace(/n/g, '[nñ]');

        this.filtros.nome = {
                $regex: pattern,
                $options: "i"
            };
        }
        return this;
    }
    comAtivo(ativo = true) {
            if (ativo !== undefined) {
                const valor =
                    ativo === true || ativo === "true" || ativo === 1 || ativo === "1";
                this.filtros.ativo = valor;
            }
            return this;
        }
    comPreco(minPreco, maxPreco) {
        if (minPreco !== undefined || maxPreco !== undefined) {
            this.filtros.preco = {};

            if (isNumeric(minPreco)) {
                this.filtros.preco.$gte = Number(minPreco);
            }

            if (isNumeric(maxPreco)) {
                this.filtros.preco.$lte = Number(maxPreco);
            }

            if (Object.keys(this.filtros.preco).length === 0) {
                delete this.filtros.preco;
            }
        }
        return this;
    }

    build() {
        return { ...this.filtros };
    }
}

function isNumeric(value) {
    return value !== '' && value !== null && value !== undefined && !isNaN(Number(value));
}

export default AdicionalOpcaoFilterBuild;
