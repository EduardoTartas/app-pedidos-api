// src/utils/helpers/PermissionHelper.js

import CustomError from './CustomError.js';
import HttpStatusCodes from './HttpStatusCodes.js';
import messages from './messages.js';

function ensurePermission({ usuarioLogado, targetId, field, customMessage = messages.auth.invalidPermission }) {
    const isAdmin = usuarioLogado.isAdmin;
    const isOwner = String(usuarioLogado._id) === String(targetId);

    if (!isAdmin && !isOwner) {
        throw new CustomError({
            statusCode: HttpStatusCodes.FORBIDDEN.code,
            errorType: 'permissionError',
            field,
            details: [],
            customMessage,
        });
    }

    return { isAdmin, isOwner };
}

export default ensurePermission;
