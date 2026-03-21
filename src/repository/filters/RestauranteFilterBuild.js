import mongoose from "mongoose";

class RestauranteFilterBuild {
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

    comStatus(status) {
        if (status) {
            this.filtros.status = {
                $regex: status,
                $options: "i"
            };
        }
        return this;
    }

    comCategorias(categoria_ids) {
        if (categoria_ids) {
            // Suporta array de ObjectId ou string separada por virgula
            const categorias = Array.isArray(categoria_ids)
                ? categoria_ids
                : categoria_ids.split(',');

            const objectIds = categorias
                .filter(id => mongoose.Types.ObjectId.isValid(id.trim()))
                .map(id => new mongoose.Types.ObjectId(id.trim()));

            if (objectIds.length > 0) {
                this.filtros.categoria_ids = { $in: objectIds };
            }
        }
        return this;
    }

    build() {
        return this.filtros;
    }
}

export default RestauranteFilterBuild;
