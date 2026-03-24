<p align="center">
  <img src="https://img.shields.io/badge/Rest_API-02303A?style=for-the-badge&logo=json&logoColor=white" alt="Rest API"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Auth_JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger"/>
</p>

# 📋 Documentação de Rotas - API de Delivery

Bem-vindo à documentação oficial das rotas da **API de Delivery**. 
Aqui você encontra de forma detalhada o mapeamento de endpoints, regras de negócio associadas a cada um, padrões de validação e restrições de permissão.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Desenvolvimento-brightgreen?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Versão-v1.0.0-orange?style=flat-square" alt="Versão"/>
</p>

---

## 🧭 Sumário

1. [Visão Geral e Regras Comuns](#-visão-geral-e-regras-comuns)
2. [🔐 Autenticação](#-autenticação)
3. [👤 Usuários](#-usuários)
4. [🏪 Restaurantes](#-restaurantes)
5. [🍽️ Pratos](#️-pratos)
6. [📑 Categorias](#-categorias)
7. [➕ Adicionais (Grupos e Opções)](#-adicionais-grupos-e-opções)
8. [🚚 Pedidos](#-pedidos)
9. [⭐ Avaliações](#-avaliações)
10. [📍 Endereços](#-endereços)
11. [🔔 Notificações](#-notificações)

---

## 📌 Visão Geral e Regras Comuns

### 🛡️ Segurança e Controle de Acesso
- **Middleware Global (`AuthMiddleware`)**: Grande parte da API está protegida. O token JWT (Bearer) é obrigatório e validado quanto à expiração e revogação.
- **Autorização Baseada em Propriedade (`Owner/Admin`)**: A API não permite que um usuário altere recursos que não sejam seus, a não ser que possua a flag `isAdmin = true`.
- **🚀 Limitação de Requisições (Rate Limit - Não Implementado em Todas as Rotas Ainda)**:
  - Rotas Críticas (Login, Recover, Reset): Máximo ![Rate_Limit](https://img.shields.io/badge/50_req_/_5_min-red?style=flat-square).
  - Rotas Autenticadas (Gerais): Máximo ![Rate_Limit](https://img.shields.io/badge/100_req_/_15_min-yellow?style=flat-square).

### ⚙️ Convenção de Status
As entidades base da aplicação obedecem padrões estritos de status:
- **Restaurantes**: ![Aberto](https://img.shields.io/badge/-aberto-brightgreen?style=flat-square) | ![Fechado](https://img.shields.io/badge/-fechado-red?style=flat-square) | ![Inativo](https://img.shields.io/badge/-inativo-gray?style=flat-square). **Nota:** Pedidos só entram se o status for `aberto`.
- **Pratos**: ![Ativo](https://img.shields.io/badge/-ativo-brightgreen?style=flat-square) | ![Inativo](https://img.shields.io/badge/-inativo-red?style=flat-square). **Nota:** Pratos inativos não podem ser adicionados em novos pedidos.
- **Pedidos**: Passam, obrigatoriamente, por um funil de controle:
  `criado` ➔ `em_preparo` ➔ `a_caminho` ➔ `entregue`. Pode ser `cancelado` antes da entrega.

---

## 🔐 Autenticação
Base do sistema de controle de acesso. Funciona via JWT Bearer Token sem validação por cookie, operando inteiramente em JSON.

| Método | Endpoint | Parâmetros | Permissão / Validações |
|--------|----------|------------|------------------------|
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/login` | ![Body](https://img.shields.io/badge/body-blue?style=flat-square) `email`, `senha` | Rate limit estrito. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/logout` | ![Body](https://img.shields.io/badge/body-blue?style=flat-square) `access_token` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Invalida o refresh token. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/refresh` | ![Body](https://img.shields.io/badge/body-blue?style=flat-square) `refresh_token` | Gera novo access token. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/recover` | ![Body](https://img.shields.io/badge/body-blue?style=flat-square) `email` | E-mail de recuperação (5 min de timeout p/ novo envio). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/password/reset` | ![Body](https://img.shields.io/badge/body-blue?style=flat-square) `senha` <br> ![Query](https://img.shields.io/badge/query-orange?style=flat-square) `token` | Força padrão de senha (8+ chars, mix números, maiusc/minusc). |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/signup` | ![Body](https://img.shields.io/badge/body-blue?style=flat-square) `nome`, `email`, `senha`, `cpf`, `telefone` | O usuário criado sempre terá `isAdmin = false`. |

---

## 👤 Usuários
Controle de clientes administradores do sistema e de restaurantes.

| Método | Endpoint | Params | Permissão / Regras de Negócio |
|--------|----------|--------|-------------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/usuarios` | - | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/usuarios/:id` | ![Param](https://img.shields.io/badge/param-yellow?style=flat-square) `:id` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Retorna dados de um usuário. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/usuarios` | - | ![Admin](https://img.shields.io/badge/Apenas-Admin-1F6FEB?style=flat-square) Validações avançadas de CPF e limite mínimo de Nome (2 char). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/usuarios/:id` | ![Param](https://img.shields.io/badge/param-yellow?style=flat-square) `:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Usuário comum não altera privilégio (isAdmin). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/usuarios/:id/status` | ![Param](https://img.shields.io/badge/param-yellow?style=flat-square) `:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Serve para ativar/desativar conta. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/usuarios/:id` | ![Param](https://img.shields.io/badge/param-yellow?style=flat-square) `:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Realiza "Soft Delete". |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/usuarios/:id/foto` | ![Param](https://img.shields.io/badge/param-yellow?style=flat-square) `:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Upload `multipart/form-data`. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/usuarios/:id/foto` | ![Param](https://img.shields.io/badge/param-yellow?style=flat-square) `:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Exclusão da imagem atual. |

---

## 🏪 Restaurantes
Qualquer usuário administrador/proprietário pode gerir o cardápio base de um restaurante.

| Método | Endpoint | Regras de Negócio / Permissão |
|--------|----------|-------------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Lista restaurantes `abertos` ou `ativos`. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes/:id` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Traz informações públicas se não inativo. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes/meus` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Retorna seus restaurantes (`dono_id = user_id`). Admin vê todos. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/restaurantes` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Obrigatório: Nome, Array Categorias, CNPJ (14 dig). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/restaurantes/:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Atualiza status, taxa de entrega, categorias. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/restaurantes/:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Operação protegida (Soft Delete). |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/restaurantes/:id/foto` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Upload via form-data para os buckets. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/restaurantes/:id/foto` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Deletar foto existente. |

---

## 🍽️ Pratos
Estruturação e manipulação do cardápio ofertado pelo restaurante.

| Método | Endpoint | Regras de Negócio e Permissões |
|--------|----------|--------------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pratos` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Listagem bruta com filtros opcionais. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pratos/:id` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Apenas com status `ativo`. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/cardapio/:restauranteId` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Retorna menu agrupado por seções. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/pratos` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) **Body:** `restaurante_id`, `nome`, `preco`, `secao`. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/pratos/:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Modifica preço, status ou seção de um item. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/pratos/:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Desativa item deletando via soft delete. |

---

## 📑 Categorias
Rotulam o modelo de negócio dos restaurantes (Ex: "Saudável", "Hambúrguer", "Asiática").

| Método | Endpoint | Regras / Observações |
|--------|----------|----------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/categorias` e `/:id` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Disponível no Catálogo inicial. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/categorias` | ![Admin](https://img.shields.io/badge/Apenas-Admin-1F6FEB?style=flat-square) Define novas categorias base. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/categorias/:id` | ![Admin](https://img.shields.io/badge/Apenas-Admin-1F6FEB?style=flat-square) Altera categorias base. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/categorias/:id` | ![Admin](https://img.shields.io/badge/Apenas-Admin-1F6FEB?style=flat-square) Remove categorias para manter padronização. |

---

## ➕ Adicionais (Grupos e Opções)

* **Regra Fundamental**: A consistência (`min`, `max`, `obrigatorio`) é imposta pelo backend no ato do pedido.

### Grupos de Adicionais
| Método | Endpoint / Params | Permissão / Validações |
|--------|-------------------|------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/adicionais/grupos/prato/:pratoId` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Lista grupos do prato. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/adicionais/grupos` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Cria vinculando nome, min/max. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/adicionais/grupos/:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Update do grupo. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/adicionais/grupos/:id` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Delete do grupo. |

### Opções dos Grupos (Valores Reais)
| Método | Endpoint / Params | Permissão / Validações |
|--------|-------------------|------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/adicionais/opcoes/:grupoId` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Mapeadas num grupo específico. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/adicionais/opcoes` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Propaga o valor, podendo este ter preço >= 0. |

---

## 🚚 Pedidos
**Core do Negócio.** Cálculos ocorrem inteiramente pela API para garantir segurança financeira.

| Método | Endpoint | Acesso / Regras de Negócio |
|--------|----------|----------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pedidos/meus` | ![Customer](https://img.shields.io/badge/Cliente-Verde?style=flat-square&color=2EA043) Aceita ![Query](https://img.shields.io/badge/query-orange?style=flat-square) `status`, `data_inicio`, `page`. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pedidos/restaurante/:restauranteId` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Restaurante gerencia pedidos recebidos. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/pedidos` | ![Customer](https://img.shields.io/badge/Cliente-Verde?style=flat-square&color=2EA043) **Regra:** O Restaurante DEVE estar _'aberto'_. Servidor ignora preços injetados pelo client e recalcula (Preço + Taxa Rest. + Adicionais). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/pedidos/:id/status` | ![Owner/Admin](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) Evolução: `criado` ➔ `em_preparo` ➔ `a_caminho` ➔ `entregue`. <br>**Cancelamento:** Apenas se não finalizado. |

---

## ⭐ Avaliações
Sistema de rating que qualifica parcerias no aplicativo.

| Método | Endpoint | Descrição e Validações |
|--------|----------|------------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/avaliacoes/restaurante/:id` | ![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat-square) Média na vitrine (`1-5`). |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/avaliacoes` | ![Customer](https://img.shields.io/badge/Cliente-Verde?style=flat-square&color=2EA043) **Restrito:** O cliente só submete nota da sua própria compra. |

---

## 📍 Endereços
Estrutura segregada de Logística. Base validada pela formatação CEP (`XXXXX-XXX`).

* **Endpoints Principais:**
  * Usuário: `/usuarios/:usuarioId/enderecos`
  * Restaurante: `/restaurantes/:restauranteId/enderecos`
  
| Operação | Método Base | Permissão / Resumo |
|----------|-------------|--------------------|
| **Criação** | ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | Obrigatório `cep`, `rua`, `numero`, `bairro`, `cidade`, `estado`. Protegido apenas para o dono. |
| **Leitura** | ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | Usuários podem ter N endereços. Restituição de restaurante é livre (![Public](https://img.shields.io/badge/Acesso-Público-2EA043?style=flat)). |
| **Delete** | ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | Remover da conta (Owner/Admin). |

---

## 🔔 Notificações
Sistema mantido pela base para disparar alertas interativos (webhook / polling).

| Método | Endpoint | Operação / Permissão |
|--------|----------|----------------------|
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/notificacoes` | ![System](https://img.shields.io/badge/Sistema-Automático-6E40C9?style=flat-square) Lança avisos de status. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/notificacoes` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Resgata caixa de entrada particular. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/notificacoes/:id/lida` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Marca booleano `lida=true`. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/notificacoes/:id` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) Remove notificação. |
