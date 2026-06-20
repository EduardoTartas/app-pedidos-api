const appRedirectRecover = (intentUrl) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - RanGo</title>
    <style>
        body { background-color: #0A0E1A; color: white; text-align: center; font-family: 'Inter', sans-serif; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #131A2A; padding: 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); max-width: 400px; width: 100%; border: 1px solid rgba(255,255,255,0.05); }
        h2 { color: #14B822; margin-bottom: 16px; font-size: 24px; }
        p { color: #8F9BB3; font-size: 15px; line-height: 1.6; margin-bottom: 30px; }
        .btn { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14B822 0%, #0E8A19 100%); color: #fff; font-weight: bold; text-decoration: none; border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 8px 24px rgba(20, 184, 34, 0.3); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(20, 184, 34, 0.4); }
        .desktop-warning { margin-top: 32px; padding: 16px; background: rgba(255,170,0,0.1); border-radius: 12px; color: #FFAA00; font-size: 14px; border: 1px solid rgba(255,170,0,0.2); display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Quase lá!</h2>
        <p>Estamos abrindo o aplicativo RanGo para você redefinir sua senha.</p>
        <a href="${intentUrl}" class="btn">Abrir Aplicativo</a>
        <div id="desktop-warning" class="desktop-warning">
            <strong>Está no computador?</strong><br><br>
            Abra este e-mail no seu celular para conseguir acessar o aplicativo e alterar sua senha.
        </div>
    </div>
    <script>
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
            document.getElementById('desktop-warning').style.display = 'block';
        } else {
            setTimeout(() => {
                window.location.href = "${intentUrl}";
            }, 500);
        }
    </script>
</body>
</html>
`;

export default appRedirectRecover;
