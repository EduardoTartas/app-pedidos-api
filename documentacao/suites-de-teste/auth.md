# Plano de Teste Endpoints: Autenticação (Auth)

Esta documentação detalha os testes de integração (endpoints) implementados para o serviço de autenticação, JWT, Login Local e OAuth (Google).

---

### POST /api/auth/login

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Login com Credenciais Válidas** | Realiza login, gera Access Token e valida/gera Refresh Token. | Requisição `POST /api/auth/login` enviando payload `{ email, senha }` corretos. | Retorna HTTP `200` com objeto `data` contendo o `user` e um objeto `tokens` com accessToken. O Refresh Token viaja via Set-Cookie (HttpOnly). |
| **Manutenção de Refresh Token** | Mantém refresh token válido já cadastrado no login se logar de novo em curto prazo. | Requisição de Login subsequente rápida. | Retorna HTTP `200` sem re-escrever desnecessariamente tokens não vencidos na base. |
| **Renovação de Refresh Expirado** | Renova refresh token expirado durante o login natural. | Login em conta que está inativa/expirada há tempo. | Retorna HTTP `200` reciclando o refresh token antigo pelo novo. |
| **Contas Inativas / Não Verificadas** | Impede acesso de usuários irregulares. | Tentativa de login de usuário `ativo: false` ou `emailVerificado: false`. | Retorna HTTP `403` informando que a conta está bloqueada ou pendente de ativação. |
| **Credenciais Erradas** | Email inexistente ou Senha inválida. | Requisição com typo ou brute-force. | Retorna HTTP `401` com "Credenciais Inválidas". (Nunca revela qual dos dois errou). |
| **Contas Google-Only** | Impede login via senha em contas criadas nativamente pelo Google. | Login via POST passando senha manual. | Retorna HTTP `401` com mensagem explicativa "Utilize login social". |
| **Payload Inválido** | Bloqueia payloads incompletos. | Login omitindo e-mail ou senha. | Retorna HTTP `400` do validador Zod. |

---

### POST /api/auth/logout

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Logout Padrão** | Realiza logout invalidando cookies e limpando tokens no banco. | Requisição `POST /api/auth/logout` com Cookie e header de `Authorization`. | Retorna HTTP `200` e seta o Header HTTP `Set-Cookie: refreshToken=; Max-Age=0`. |
| **Falha por Falta de Token** | Sem token ou Token null textual ou token sem ID no payload (anomalia JWT). | Requisição desconfigurada ou forjada. | Retorna HTTP `400` ou `498` (Token Inválido/Expirado). |

---

### POST /api/auth/refresh

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Geração de Novo Access** | Gera novo access token renovando o lease. Atualiza a flag `profileComplete` dinamicamente baseada nos dados do usuário se ele recém completou o perfil. | Requisição `POST /api/auth/refresh` com cookie válido atrelado ao user. | Retorna HTTP `200` enviando apenas um novo Access Token de curta duração. |
| **Rejeição por Token Roubado** | Se o Refresh Token for válido matematicamente, mas diferente do armazenado (Roubo de Sessão). | Submissão de token que já foi reciclado. | Retorna HTTP `401` (Sessão revogada). |
| **Anomalias de Sessão** | Refresh token de usuário inexistente ou ausente. | Submissão de lixo ou cookies limpos. | Retorna HTTP `404` ou `400`. |

---

### POST /api/auth/recover e PATCH /api/auth/password/reset

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Inicia Recuperação (Recover)** | Envia email de recuperação acionando o SES/Mailer. | Requisição `POST /api/auth/recover` passando `{ email }`. | Retorna HTTP `200` (Mensagem de "Verifique sua caixa de entrada"). Se email não existir, retorna `404`. |
| **Conclui Recuperação (Reset)** | Atualiza senha com token de recuperação válido gerado e salvo no banco. | Requisição `PATCH /api/auth/password/reset` enviando `token` via Header ou Body e nova `{ senha }`. | Retorna HTTP `200` (Senha atualizada) e apaga o token temporário da base. |
| **Proteção de Token de Reset** | Sem token de reset ou token inválido/expirado. | Tentativas tardias ou forjadas. | Retorna HTTP `401` ou `404`. |

---

### POST /api/auth/signup e GET /api/auth/verificar-email

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação Rápida de Usuário** | Cria usuário e envia e-mail de verificação automaticamente. | Requisição `POST /api/auth/signup` com `{nome, email, senha}`. | Retorna HTTP `201`. O usuário nasce com `ativo: true` mas `emailVerificado: false`. |
| **Verifica Email com Sucesso** | Processa clique do link no e-mail, ativando plenamente o perfil. | Requisição `GET /api/auth/verificar-email?token=xyz`. | Retorna HTTP `200`. Flag `emailVerificado` passa a ser `true`. |
| **Reenvio Automático** | Se o token expirado for enviado, o sistema tenta ajudar e reenvia um novo email de verificação. | Requisição `GET` com token datado. | Retorna HTTP `400` mas dispara fila de reenvio proativamente. |

---

### POST /api/auth/google

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Login Social Novo** | Cria usuário novo (com ou sem foto) decodificando JWT do Google e emite tokens da plataforma. | Requisição `POST /api/auth/google` enviando o idToken do provedor. | Retorna HTTP `200`. Transforma o perfil Google num perfil interno válido. |
| **Mescla de Contas Local** | Vincula conta local existente (com ou sem senha) usando o mesmo e-mail do Google. | Requisição `POST` com token cujo e-mail já existe. | Retorna HTTP `200` atrelando o `googleId` no banco e logando o usuário unificadamente. |
| **Renovação por OAuth** | Reutiliza usuário pelo `googleId` e renova refresh token expirado caso ele seja usuário fiel. | Submissão regular por usuários Google. | Retorna HTTP `200`. |
| **Defesas Contra Token Falsos** | Rejeita token que falhe ao tentar dar `.verify()` com os certificados do Google. | Requisições com JWTs forjados de testes ou expirados no Google. | Retorna HTTP `401`. Se user for inativo no nosso sistema, retorna `403`. |
