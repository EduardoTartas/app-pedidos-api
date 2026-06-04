// src/utils/TokenUtil.js

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class TokenUtil {
    generateAccessToken(id) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                { id },
                process.env.JWT_SECRET_ACCESS_TOKEN,
                { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1d' },
                (err, token) => {
                    if (err) return reject(err);
                    resolve(token);
                }
            );
        });
    }

    generateRefreshToken(id) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                { id },
                process.env.JWT_SECRET_REFRESH_TOKEN,
                { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d' },
                (err, token) => {
                    if (err) return reject(err);
                    resolve(token);
                }
            );
        });
    }

    generatePasswordRecoveryToken(id) {
        return new Promise((resolve, reject) => {
            jwt.sign(
                { id },
                process.env.JWT_SECRET_PASSWORD_RECOVERY,
                { expiresIn: process.env.JWT_PASSWORD_RECOVERY_EXPIRATION || '1h' },
                (err, token) => {
                    if (err) return reject(err);
                    resolve(token);
                }
            );
        });
    }

    /**
     * Gera um token de recuperação criptograficamente seguro (SEC-03).
     * Usa crypto.randomBytes: 256 bits de entropia, impossível de bruteforçar.
     * Substituiu Math.random() que tinha apenas 900.000 combinações possíveis.
     */
    generateRecoveryCode() {
        return crypto.randomBytes(32).toString('hex');
    }

    decodePasswordRecoveryToken(token, secret) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secret, (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded.id);
            });
        });
    }
}

export default new TokenUtil();
