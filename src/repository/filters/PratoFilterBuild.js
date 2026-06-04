import mongoose from "mongoose";

class PratoFilterBuild {
    constructor() {
        this.filtros = {};
    }

    comRestaurante(restauranteId) {
        if (restauranteId) {
            this.filtros.restaurante_id = mongoose.Types.ObjectId.isValid(restauranteId)
                ? new mongoose.Types.ObjectId(restauranteId)
                : restauranteId;
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

    comCategoriaSecao(secao) {
        if (secao) {
            this.filtros.secao = {
                $regex: secao,
                $options: "i"
            };
        }
        return this;
    }

    comStatus(status) {
        if (status) {
            this.filtros.status = {
                $regex: status,
                $options: "i"
            };
        }
        return this;
    }

    comPreco(minPreco, maxPreco) {
        if (minPreco !== undefined || maxPreco !== undefined) {
            this.filtros.preco = {};
            if (minPreco !== undefined && notNaN(minPreco)) {
                this.filtros.preco.$gte = Number(minPreco);
            }
            if (maxPreco !== undefined && notNaN(maxPreco)) {
                this.filtros.preco.$lte = Number(maxPreco);
            }
            if (Object.keys(this.filtros.preco).length === 0) {
                delete this.filtros.preco;
            }
        }
        return this;
    }

    build() {
        return this.filtros;
    }
}

function notNaN(val) {
    return val !== '' && !isNaN(Number(val));
}

export default PratoFilterBuild;
