// src/utils/helpers/mongooseBrazilianDatePlugin.js

function brazilianDatePlugin(schema) {
    // Mantemos os setters para aceitar datas em formato brasileiro no input se necessário,
    // mas removemos os getters que forçam string no output, pois quebra bibliotecas do frontend.
    schema.set('toJSON', { getters: true });
    schema.set('toObject', { getters: true });

    schema.eachPath((pathname, schematype) => {
        if (schematype.instance === 'Date') {
            // Removido o getter que convertia para DD/MM/YYYY

            schematype.set(function (value) {
                if (!value) return null;
                if (value instanceof Date) return value;
                if (typeof value === 'string' && value.includes('/')) {
                    const [dia, mes, ano] = value.split('/').map(Number);
                    return new Date(ano, mes - 1, dia);
                }
                return value;
            });
        }
    });
}

export default brazilianDatePlugin;
