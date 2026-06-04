// src/utils/templates/emailRecuperacaoSenha.js

/**
 *   - Primary Navy:   #0A0E1A
 *   - Secondary Navy: #161B2E
 *   - Brand Green:    #14B822
 *   - Pure White:     #FFFFFF
 *   - Light Gray:     #B0B8C1 (texto secundário)
 */

const emailRecuperacaoSenha = (token, nomeUsuario) => {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0A0E1A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0E1A; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color: #161B2E; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #0A0E1A; padding: 32px 40px; text-align: center; border-bottom: 2px solid #14B822;">
                                <img src="cid:logoRango" alt="RanGo" width="80" style="display: block; margin: 0 auto 16px; border: 0;">
                                <h1 style="color: #14B822; margin: 0; font-size: 28px; font-weight: 700;">RanGo</h1>
                                <p style="color: #B0B8C1; margin: 8px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Recuperação de Senha</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 8px;">
                                    Olá, <strong>${nomeUsuario}</strong>!
                                </p>
                                <p style="color: #B0B8C1; font-size: 14px; line-height: 1.7; margin: 0 0 28px;">
                                    Recebemos uma solicitação para redefinir a senha da sua conta.
                                    Use o código abaixo no aplicativo para concluir o processo:
                                </p>

                                <!-- Token Box -->
                                <div style="background-color: #0A0E1A; border: 1px solid #14B822; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 28px;">
                                    <p style="color: #14B822; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; font-weight: 600;">
                                        Seu código de recuperação
                                    </p>
                                    <p style="color: #FFFFFF; font-size: 32px; font-family: 'Courier New', monospace; letter-spacing: 8px; margin: 0; line-height: 1.2; font-weight: 700; background-color: #161B2E; padding: 16px; border-radius: 6px;">
                                        ${token}
                                    </p>
                                </div>

                                <p style="color: #B0B8C1; font-size: 14px; line-height: 1.7; margin: 0 0 8px;">
                                    <strong style="color: #FFFFFF;">Copie o código acima</strong> e cole no campo de recuperação do aplicativo.
                                </p>
                                <p style="color: #6B7280; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
                                    Este código expira em <strong style="color: #B0B8C1;">1 hora</strong>.<br>
                                    Se você não solicitou essa recuperação, ignore este email.
                                </p>

                                <hr style="border: none; border-top: 1px solid #1E2540; margin: 24px 0;">

                                <p style="color: #4B5563; font-size: 11px; text-align: center; margin: 0;">
                                    Esta é uma mensagem automática, não responda a este email.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0A0E1A; padding: 16px 40px; text-align: center;">
                                <p style="color: #4B5563; font-size: 11px; margin: 0;">
                                    © ${new Date().getFullYear()} RanGo — Todos os direitos reservados.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

export default emailRecuperacaoSenha;
