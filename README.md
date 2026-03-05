# 🚀 App Pedidos - API

[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-blue.svg)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-✅-brightgreen.svg)](https://jestjs.io/)

API REST para gerenciamento de pedidos de delivery desenvolvida com Node.js, Express e MongoDB.

## 📋 Sobre o Projeto

Plataforma de delivery que conecta clientes a restaurantes, permitindo realizar pedidos, acompanhar status em tempo real e avaliar a experiência.

**Objetivos:**
- ✅ Facilitar pedidos de delivery online
- ✅ Gerenciamento completo de restaurantes e cardápios
- ✅ Acompanhamento de pedidos em tempo real
- ✅ Sistema de avaliações e notificações

## 🎯 Funcionalidades

### 👥 Gestão de Usuários
- Cadastro e autenticação (JWT)
- Perfis: Cliente, Dono de Restaurante, Admin
- Recuperação de senha via email
- Ativação/desativação de contas

### 🍽️ Gestão de Restaurantes
- CRUD completo de restaurantes
- Categorização por tipo de culinária
- Gerenciamento de cardápio (pratos)
- Adicionais com grupos e opções (min/max por grupo)
- Cálculo automático de nota média

### 📦 Gestão de Pedidos
- Criação de pedidos com itens e adicionais
- Cálculo automático de subtotal, taxa de entrega e total
- Esteira de status: Criado → Em Preparo → A Caminho → Entregue
- Cancelamento com regras de negócio
- Histórico de pedidos por cliente e restaurante

### ⭐ Avaliações
- Avaliação de pedidos entregues (nota 1-5 + comentário)
- Recálculo automático de nota média do restaurante
- Uma avaliação por pedido

### 🔔 Notificações
- Notificação automática ao dono do restaurante (novo pedido)
- Notificação ao cliente a cada mudança de status
- Marcação de leitura

### 🛡️ Segurança
- Rate limiting (7 req/min)
- Autenticação JWT com refresh tokens
- Validação rigorosa (Zod)
- Logs estruturados
- Containerização Docker

## 🚀 Quick Start

> **IMPORTANTE:** Execute os containers pelo **frontend**. Veja o [README do Frontend](../app-pedidos-front/README.md).

### Apenas para Desenvolvimento Local da API

Se quiser rodar **apenas a API** isoladamente:

```bash
# 1. Configure credenciais de email
# 1.1 Gere senha de aplicativo Gmail: https://myaccount.google.com/apppasswords
# 1.2 Cadastre no Mailsender: https://mailsender.app.fslab.dev/cadastro
#     - Nome: Nome do projeto
#     - Email: Seu email Gmail
#     - Senha: Senha de aplicativo gerada
# 1.3 Copie a API Key gerada

# 2. Configure variáveis de ambiente
nano .env
# URL_MAIL_SERVICE="https://mailsender.app.fslab.dev/api/emails/send"
# MAIL_API_KEY="sua-api-key-copiada-do-mailsender"

# 3. Inicie
docker compose -f docker-compose-dev.yml up --build

# 4. Popule banco
docker compose -f docker-compose-dev.yml exec api npm run seed

# 5. Teste
docker compose -f docker-compose-dev.yml exec api npm test
```

## 📚 Documentação da API

### Acesso
- **Swagger UI:** http://localhost:5020/docs
- **Health Check:** http://localhost:5020/health

### Endpoints Principais

#### Autenticação
```
POST   /login              - Login
POST   /refresh            - Renovar token
POST   /logout             - Logout
POST   /recover            - Recuperar senha
PATCH  /password/reset     - Redefinir senha
POST   /signup             - Cadastro público
```

#### Usuários
```
GET    /usuarios           - Listar
POST   /usuarios           - Criar
GET    /usuarios/:id       - Buscar por ID
PATCH  /usuarios/:id       - Atualizar
DELETE /usuarios/:id       - Deletar
PATCH  /usuarios/:id/status - Alterar status
```

#### Categorias
```
GET    /categorias         - Listar
POST   /categorias         - Criar
GET    /categorias/:id     - Buscar por ID
PATCH  /categorias/:id     - Atualizar
DELETE /categorias/:id     - Deletar
```

#### Restaurantes
```
GET    /restaurantes       - Listar
POST   /restaurantes       - Criar
GET    /restaurantes/:id   - Buscar por ID
PATCH  /restaurantes/:id   - Atualizar
DELETE /restaurantes/:id   - Deletar
```

#### Pratos
```
GET    /pratos             - Listar
POST   /pratos             - Criar
GET    /pratos/:id         - Buscar por ID
PATCH  /pratos/:id         - Atualizar
DELETE /pratos/:id         - Deletar
GET    /cardapio/:restauranteId - Cardápio do restaurante
```

#### Adicionais
```
GET    /adicionais/grupos/:restauranteId - Listar grupos
POST   /adicionais/grupos               - Criar grupo
PATCH  /adicionais/grupos/:id           - Atualizar grupo
DELETE /adicionais/grupos/:id           - Deletar grupo
GET    /adicionais/opcoes/:grupoId      - Listar opções
POST   /adicionais/opcoes               - Criar opção
PATCH  /adicionais/opcoes/:id           - Atualizar opção
DELETE /adicionais/opcoes/:id           - Deletar opção
```

#### Pedidos
```
GET    /pedidos/meus                     - Meus pedidos (cliente)
GET    /pedidos/restaurante/:restauranteId - Pedidos do restaurante
POST   /pedidos                          - Criar pedido
PATCH  /pedidos/:id/status               - Atualizar status
```

#### Avaliações
```
GET    /avaliacoes/restaurante/:restauranteId - Listar por restaurante
POST   /avaliacoes                           - Criar avaliação
```

#### Notificações
```
GET    /notificacoes         - Listar minhas notificações
PATCH  /notificacoes/:id/lida - Marcar como lida
```

## 🔒 Segurança

### Rate Limiting
- **Limite:** 7 requisições/minuto por IP
- **Resposta:** Status 429
- **Header:** `X-RateLimit-Remaining`

### Autenticação JWT
- **Access Token:** Expira em 15 minutos
- **Refresh Token:** Expira em 7 dias
- **Rotas Protegidas:** Middleware obrigatório

### Validação (Zod)
- Schema validation rigoroso
- Sanitização de dados
- Validação de tipos

### Requisitos de Senha
```regex
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
```
- Mínimo 8 caracteres
- 1 maiúscula, 1 minúscula
- 1 número
- 1 caractere especial (@, $, !, %, *, ?, &)

## 📊 Monitoramento

### Logs Estruturados
- Níveis: info, warn, error
- Formato: JSON
- Contexto: Service, timestamp, requestId

### Health Check
```bash
curl http://localhost:5020/health
```

Resposta:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-16T12:00:00.000Z",
  "uptime": 3600
}
```

## 🧪 Testes

```bash
# Todos os testes
docker compose -f docker-compose-dev.yml exec api npm test

# Com cobertura
docker compose -f docker-compose-dev.yml exec api npm run test:coverage

# Watch mode
docker compose -f docker-compose-dev.yml exec api npm run test:watch
```

## 🏗️ Arquitetura

```
src/
├── app.js              # Configuração Express
├── server.js           # Inicialização
├── config/
│   └── dbConnect.js    # MongoDB
├── controllers/        # Lógica de controle
├── middlewares/         # Middlewares customizados
├── models/             # Schemas Mongoose
├── repository/         # Acesso a dados
├── routes/             # Rotas
├── services/           # Lógica de negócio
├── utils/              # Utilitários
├── seeds/              # Dados iniciais
└── docs/               # Swagger
```

## 📜 Scripts NPM

```json
{
  "dev": "nodemon server.js",
  "start": "node server.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "seed": "node src/seeds/seeds.js",
  "lint": "eslint src/**/*.js",
  "lint:fix": "eslint src/**/*.js --fix"
}
```

## 🛠️ Stack Tecnológica

- **Runtime:** Node.js 22+
- **Framework:** Express.js 5
- **Banco:** MongoDB 8 com Mongoose ODM
- **Auth:** JWT (access + refresh tokens)
- **Validação:** Zod schemas
- **Docs:** Swagger/OpenAPI
- **Testes:** Jest + Supertest
- **Container:** Docker & Docker Compose
- **Email:** Mailsender (custom service)

## 👥 Equipe

| Nome | Função | E-mail |
|------|--------|--------|
| - | - | - |

## 📄 Licença

> ### Este projeto está licenciado sob a [Licença MIT](./LICENSE).
