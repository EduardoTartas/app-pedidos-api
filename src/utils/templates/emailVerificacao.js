const emailVerificacao = (linkVerificacao, nomeUsuario) => {
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
                                <p style="color: #B0B8C1; margin: 8px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Verificação de Email</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 8px;">
                                    Olá, <strong>${nomeUsuario}</strong>!
                                </p>
                                <p style="color: #B0B8C1; font-size: 14px; line-height: 1.7; margin: 0 0 28px;">
                                    Bem-vindo(a) ao RanGo! Para completar o seu cadastro e garantir a segurança da sua conta, por favor, clique no botão abaixo para verificar seu endereço de email.
                                </p>

                                <!-- Button -->
                                <div style="text-align: center; margin: 0 0 28px;">
                                    <a href="${linkVerificacao}" style="background-color: #14B822; color: #0A0E1A; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; letter-spacing: 1px;">
                                        Verificar Email
                                    </a>
                                </div>

                                <p style="color: #B0B8C1; font-size: 14px; line-height: 1.7; margin: 0 0 8px;">
                                    Ou copie e cole o link abaixo no seu navegador:
                                </p>
                                <p style="color: #6B7280; font-size: 12px; line-height: 1.6; word-break: break-all; background-color: #0A0E1A; padding: 12px; border-radius: 6px; margin: 0 0 24px;">
                                    ${linkVerificacao}
                                </p>

                                <hr style="border: none; border-top: 1px solid #1E2540; margin: 24px 0;">

                                <p style="color: #4B5563; font-size: 11px; text-align: center; margin: 0;">
                                    Este link é válido por <strong>24 horas</strong>.<br>Se você não se cadastrou no RanGo, por favor ignore este email.
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

export default emailVerificacao;
