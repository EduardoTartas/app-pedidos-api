const appRedirectRecover = (intentUrl, frontendUrl) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - RanGo</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
        
        body { 
            background-color: #0A0E1A; 
            color: white; text-align: center; font-family: 'Outfit', sans-serif; 
            padding: 20px; display: flex; flex-direction: column; align-items: center; 
            justify-content: center; min-height: 100vh; margin: 0; 
        }
        
        .card { 
            background: rgba(19, 26, 42, 0.7); 
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            padding: 48px 32px; 
            border-radius: 28px; 
            box-shadow: 0 24px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05); 
            max-width: 400px; width: 100%; box-sizing: border-box;
            border: 1px solid rgba(255,255,255,0.08); 
            animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(20, 184, 34, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(20, 184, 34, 0); } 100% { box-shadow: 0 0 0 0 rgba(20, 184, 34, 0); } }

        .icon-container {
            width: 72px; height: 72px; margin: 0 auto 24px auto;
            background: rgba(20, 184, 34, 0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(20, 184, 34, 0.2);
            animation: pulseGlow 2s infinite;
        }

        h2 { color: #fff; margin: 0 0 12px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        p { color: #8F9BB3; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; font-weight: 400; }

        .btn { 
            display: flex; align-items: center; justify-content: center; gap: 10px;
            padding: 16px 24px; background: linear-gradient(135deg, #14B822 0%, #0E8A19 100%); 
            color: #fff; font-weight: 600; font-size: 16px; text-decoration: none; 
            border-radius: 16px; transition: all 0.3s ease; 
            box-shadow: 0 8px 24px rgba(20, 184, 34, 0.25); 
            width: 100%; box-sizing: border-box; cursor: pointer;
        }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(20, 184, 34, 0.4); }
        .btn:active { transform: translateY(0); }

        #desktop-btn { background: linear-gradient(135deg, #1A73E8 0%, #1557B0 100%); box-shadow: 0 8px 24px rgba(26, 115, 232, 0.25); }
        #desktop-btn:hover { box-shadow: 0 12px 32px rgba(26, 115, 232, 0.4); }

        .desktop-warning { 
            margin-top: 32px; padding: 16px; background: rgba(26,115,232,0.1); 
            border-radius: 16px; color: #66A3FF; font-size: 14px; 
            border: 1px solid rgba(26,115,232,0.2); display: none; 
            animation: fadeIn 0.4s ease-out;
        }

        /* Oculta o botão do app em telas grandes (PC) */
        @media (min-width: 769px) {
            #app-btn { display: none !important; }
            #btn-spacer, #btn-spacer2 { display: none !important; }
        }
        /* Oculta o botão de navegador em telas pequenas (Celular) */
        @media (max-width: 768px) {
            #desktop-btn { display: none !important; }
            #btn-spacer, #btn-spacer2 { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14B822" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
        </div>
        <h2>Quase lá!</h2>
        <p>Estamos redirecionando você de forma segura para redefinir sua senha.</p>
        
        <a id="app-btn" href="${intentUrl}" class="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            Abrir Aplicativo
        </a>
        <br id="btn-spacer"><br id="btn-spacer2">
        <a id="desktop-btn" href="${frontendUrl}" class="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Continuar no Navegador
        </a>
        
        <div id="desktop-warning" class="desktop-warning">
            Aguarde um momento, conectando...
        </div>
    </div>
    <script>
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
            document.getElementById('desktop-warning').style.display = 'block';
            window.location.href = "${frontendUrl}";
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
