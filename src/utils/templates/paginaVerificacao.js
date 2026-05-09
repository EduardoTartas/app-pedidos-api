export const templateSucessoVerificacao = (urlApp) => `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verificado</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0A0E1A;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .container {
      background-color: #161B2E;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      width: 90%;
      max-width: 400px;
      border: 1px solid #1e2540;
    }
    h1 {
      color: #14B822; /* PrimaryGreen */
      margin-bottom: 20px;
      font-weight: 700;
    }
    p {
      color: #B0B8C1;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      background-color: #14B822;
      color: #0A0E1A;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      transition: background-color 0.3s, transform 0.1s;
      letter-spacing: 1px;
    }
    .btn:hover {
      background-color: #119e1c;
      transform: scale(1.02);
    }
    .icon {
      width: 64px;
      height: 64px;
      background-color: rgba(20, 184, 34, 0.15);
      color: #14B822;
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      font-size: 32px;
      margin-bottom: 20px;
      box-shadow: 0 0 15px rgba(20, 184, 34, 0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>Email Verificado!</h1>
    <p>Sua conta foi ativada com sucesso. Você já pode retornar ao aplicativo e fazer o login.</p>
    <a href="${urlApp}" class="btn">VOLTAR PARA O APP</a>
  </div>
</body>
</html>
`;

export const templateErroVerificacao = (mensagemErro, urlApp) => `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Falha na Verificação</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0A0E1A;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .container {
      background-color: #161B2E;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      width: 90%;
      max-width: 400px;
      border: 1px solid #1e2540;
    }
    h1 {
      color: #ef4444; /* Vermelho Erro */
      margin-bottom: 20px;
      font-weight: 700;
    }
    p {
      color: #B0B8C1;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      background-color: #1E2540;
      color: #FFFFFF;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      transition: background-color 0.3s;
      border: 1px solid #2d3559;
    }
    .btn:hover {
      background-color: #2a3350;
    }
    .icon {
      width: 64px;
      height: 64px;
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      font-size: 32px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✕</div>
    <h1>Ops, falha na verificação</h1>
    <p>${mensagemErro}</p>
    <a href="${urlApp}" class="btn">Retornar ao Aplicativo</a>
  </div>
</body>
</html>
`;
