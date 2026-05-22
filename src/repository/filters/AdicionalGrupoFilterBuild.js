import mongoose from "mongoose";

class AdicionalGrupoBuild {
    constructor() {
        this.filtros = {};
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

    comAtivo(ativo) {
        if (ativo !== undefined) {
            const valor =
                ativo === true || ativo === "true" || ativo === 1 || ativo === "1";
            this.filtros.ativo = valor;
        }
        return this;
    }

    comRestauranteId(restaurante_id) {
        if (restaurante_id) {
            try {
                const objectId = new mongoose.Types.ObjectId(restaurante_id);
                this.filtros.restaurante_id = objectId;
            } catch (error) {
                // ID inválido, não adiciona ao filtro
            }
        }
        return this;
    }

    comTipo(tipo) {
        const tipos_validos = ["adicional", "variacao"];
        if (tipo && tipos_validos.includes(tipo)) {
            this.filtros.tipo = tipo;
        }
        return this;
    }

    comObrigatorio(obrigatorio) {
        if (obrigatorio !== undefined) {
            const valor =
                obrigatorio === true || obrigatorio === "true" || obrigatorio === 1 || obrigatorio === "1";
            this.filtros.obrigatorio = valor;
        }
        return this;
    }

    build() {
        return { ...this.filtros };
    }
}

export default AdicionalGrupoBuild;
