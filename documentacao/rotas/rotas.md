# Documentação de Rotas - API de Delivery

Esta documentação descreve o mapeamento dos endpoints da API de Delivery, incluindo as regras de negócio associadas, padrões de validação, limites de requisição e restrições de permissão.

## Sumário

1. [Visão Geral, Regras e Status](#visao-geral-e-regras)
2. [Sistema e Base](#sistema-e-base)
3. [Autenticação](#autenticacao)
4. [Usuários](#usuarios)
5. [Restaurantes](#restaurantes)
6. [Categorias](#categorias)
7. [Pratos e Cardápio](#pratos-e-cardapio)
8. [Adicionais (Grupos e Opções)](#adicionais-grupos-e-opcoes)
9. [Endereços (Usuários e Restaurantes)](#enderecos)
10. [Pedidos](#pedidos)
11. [Avaliações](#avaliacoes)
12. [Notificações](#notificacoes)

---

## Visão Geral e Regras

### Segurança e Controle de Acesso
- **Middleware Global (`AuthMiddleware`)**: Valida a sessão por meio do token JWT (Bearer).
- **Autorização Baseada em Propriedade (Owner/Admin)**: Apenas detentores do recurso (proprietários de restaurantes ou usuários donos do próprio cadastro) ou Administradores têm permissão para realizar alterações.
- **Conformidade LGPD**: Implementado sistema de **Exclusão Lógica (Soft Delete)**. Os dados não são removidos fisicamente para preservar o histórico transacional.

### Convenção de Status (Regras de Negócio)
- **Restaurantes**: 
    - `ativo` (true/false): Controle administrativo de visibilidade global.
    - `status` (aberto/fechado): Controle operacional diário.
- **Pratos**: `ativo` ou `inativo`.
- **Pedidos**: O avanço no fluxo de preparo é estrito. O ciclo é: `criado` -> `em_preparo` -> `a_caminho` -> `entregue`.

---

## Sistema e Base

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/` | Público | Redireciona para o documento de especificações (`/docs`). |
| GET | `/docs` | Público | Interface do Swagger UI. |
| GET | `/health` | Público | Status do MongoDB e uptime. |

---

## Autenticação

| Método | Endpoint | Permissão Base | Descrição e Validações |
|--------|----------|----------------|------------------------|
| POST | `/login` | Público | Autentica utilizando e-mail e senha. |
| POST | `/signup` | Público | Criação de um novo usuário padrão. |
| POST | `/logout` | Público | Invalida a sessão atual. |
| POST | `/refresh` | Público | Renova o Access Token usando o Refresh Token. |
| POST | `/recover` | Público | Solicitação de recuperação de senha. |
| PATCH | `/password/reset` | Público | Redefinição de senha via token. |

---

## Usuários

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/usuarios` | Obrigatória (Auth) | Lista usuários (omite senhas). |
| GET | `/usuarios/:id` | Obrigatória (Auth) | Busca cadastro específico. |
| POST | `/usuarios` | Administrador | Criação administrativa de contas. |
| PATCH | `/usuarios/:id` | Obrigatória (Auth) | Atualiza perfil. |
| PATCH | `/usuarios/:id/status` | Administrador | Bloqueio/Liberação de contas. |
| DELETE | `/usuarios/:id` | Proprietário/Admin | Soft delete da conta. |
| POST | `/usuarios/:id/foto` | Proprietário | Upload de foto de perfil. |
| DELETE | `/usuarios/:id/foto` | Proprietário | Remoção da foto de perfil. |

---

## Restaurantes

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/restaurantes` | Público | Feed de lojas (filtra por `ativo: true`). |
| GET | `/restaurantes/meus` | Obrigatória (Auth) | Lojas do usuário (inclui inativos). |
| GET | `/restaurantes/:id` | Público | Detalhes da loja. |
| POST | `/restaurantes` | Obrigatória (Auth) | Cadastro de novo estabelecimento. |
| PATCH | `/restaurantes/:id` | Proprietário/Admin | Atualiza dados, horários e campo `ativo`. |
| DELETE | `/restaurantes/:id` | Proprietário/Admin | Soft delete do restaurante. |
| POST | `/restaurantes/:id/foto` | Proprietário/Admin | Upload de logotipo. |
| DELETE | `/restaurantes/:id/foto` | Proprietário/Admin | Remoção de logotipo. |
| POST | `/restaurantes/tarefas/inatividade` | Auth (Admin) | Dispara verificação de 30 dias. |

---

## Categorias

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/categorias` | Público | Listagem global. |
| POST | `/categorias` | Administrador | Nova categoria. |
| PATCH | `/categorias/:id` | Administrador | Edição. |
| DELETE | `/categorias/:id` | Administrador | Remoção física. |
| POST | `/categorias/:id/foto` | Administrador | Upload de ícone (SVG). |

---

## Pratos e Cardápio

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/cardapio/:restauranteId` | Público | Menu agrupado por seções. |
| GET | `/pratos` | Obrigatória (Auth) | Listagem bruta para gestão. |
| GET | `/pratos/:id` | Público | Detalhes de um prato. |
| POST | `/pratos` | Proprietário | Cadastro com restaurante e seção. |
| PATCH | `/pratos/:id` | Proprietário | Edição de preço, seção e status. |
| DELETE | `/pratos/:id` | Proprietário | Remoção física do prato. |
| POST | `/pratos/:id/foto` | Proprietário | Foto do produto. |

---

## Adicionais (Grupos e Opções)

| Entidade | Método | Endpoint | Permissão | Ação |
|----------|--------|----------|-----------|------|
| Grupos | GET | `/adicionais/grupos/prato/:pratoId` | Público | Lista grupos de um prato. |
| Grupos | POST | `/adicionais/grupos` | Proprietário | Cria grupo (min/max). |
| Grupos | PATCH | `/adicionais/grupos/:id` | Proprietário | Edita regras de escolha. |
| Grupos | DELETE | `/adicionais/grupos/:id` | Proprietário | Remove grupo e opções. |
| Opções | GET | `/adicionais/opcoes/:grupoId` | Público | Lista itens do grupo. |
| Opções | POST | `/adicionais/opcoes` | Proprietário | Cria item com preço. |
| Opções | PATCH | `/adicionais/opcoes/:id` | Proprietário | Edita item. |
| Opções | DELETE | `/adicionais/opcoes/:id` | Proprietário | Remove item. |
| Opções | POST | `/adicionais/opcoes/:id/foto` | Proprietário | Foto do adicional. |

---

## Endereços

| Tipo | Método | Endpoint | Permissão | Resumo / Propósito |
|------|--------|----------|-----------|--------------------|
| Usuários | GET | `/usuarios/:usuarioId/enderecos` | Proprietário/Admin | Lista endereços do cliente. |
| Usuários | POST | `/usuarios/:usuarioId/enderecos` | Proprietário/Admin | Novo endereço (set principal). |
| Restaurantes | GET | `/restaurantes/:restauranteId/enderecos` | Público | Local físico da loja. |
| Restaurantes | POST | `/restaurantes/:restauranteId/enderecos` | Proprietário | Define endereço (único por loja). |

---

## Pedidos

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/pedidos/meus` | Obrigatória (Auth) | Histórico do cliente. |
| GET | `/pedidos/:id` | Obrigatória (Auth) | Detalhes específicos de um pedido. |
| GET | `/pedidos/restaurante/:restauranteId` | Proprietário | Gestão da cozinha. |
| POST | `/pedidos` | Obrigatória (Auth) | Checkout (calculado no server). |
| PATCH | `/pedidos/:id/status` | Obrigatória (Auth) | Avança fluxo logístico. |

---

## Avaliações

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/avaliacoes/restaurante/:restauranteId` | Público | Score da loja. |
| POST | `/avaliacoes` | Cliente | Avalia pedido entregue. |

---

## Notificações

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/notificacoes` | Obrigatória (Auth) | Inbox de avisos. |
| PATCH | `/notificacoes/:id/lida` | Obrigatória (Auth) | Marca como lida. |
| DELETE | `/notificacoes/:id` | Obrigatória (Auth) | Remove aviso. |
