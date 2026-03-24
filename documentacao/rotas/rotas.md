<p align="center">
  <img src="https://img.shields.io/badge/Rest_API-02303A?style=for-the-badge&logo=json&logoColor=white" alt="Rest API"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Auth_JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger"/>
</p>

# 📋 Documentação de Rotas - API de Delivery

Bem-vindo à documentação oficial e exaustiva das rotas da **API de Delivery**. 
Aqui você encontra de forma detalhada o mapeamento de **todos os endpoints disponíveis**, regras de negócio associadas, padrões de validação, limites de requisição e restrições de permissão.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Desenvolvimento-brightgreen?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Versão-v1.0.0-orange?style=flat-square" alt="Versão"/>
</p>

---

## 🧭 Sumário

1. [Visão Geral, Regras e Status](#-visão-geral-e-regras)
2. [🌐 Sistema e Base](#-sistema-e-base)
3. [🔐 Autenticação](#-autenticação)
4. [👤 Usuários](#-usuários)
5. [🏬 Restaurantes](#-restaurantes)
6. [📑 Categorias](#-categorias)
7. [🍽️ Pratos e Cardápio](#-pratos-e-cardápio)
8. [➕ Adicionais (Grupos e Opções)](#-adicionais-grupos-e-opções)
9. [📍 Endereços (Usuários e Restaurantes)](#-endereços)
10. [🚚 Pedidos](#-pedidos)
11. [⭐ Avaliações](#-avaliações)
12. [🔔 Notificações](#-notificações)

---

## 📌 Visão Geral e Regras

### 🛡️ Segurança e Controle de Acesso
- **Middleware Global (`AuthMiddleware`)**: Protege a malha principal da API validando a sessão no token JWT (Bearer).
- **Autorização Baseada em Propriedade (`Owner/Admin`)**: Apenas Donos do recurso (ex: Donos de restaurantes ou usuários donos da própria conta) ou Administradores realizam alterações, inibindo BOLA (Broken Object Level Authorization).
- **Rate Limit Estrito**: Rotas sensíveis (verificação/recuperação de senhas) estão sob rate limit forte ![Rate_Limit](https://img.shields.io/badge/50_req_/_5_min-red?style=flat-square).

### ⚙️ Convenção de Status (Regras de Negócio)
- **Restaurantes**: ![Aberto](https://img.shields.io/badge/-aberto-brightgreen?style=flat-square) `aberto` | ![Fechado](https://img.shields.io/badge/-fechado-red?style=flat-square) `fechado` | ![Inativo](https://img.shields.io/badge/-inativo-gray?style=flat-square) `inativo`. Pedidos bloqueados caso diferente de 'aberto'.
- **Pratos**: ![Ativo](https://img.shields.io/badge/-ativo-brightgreen?style=flat-square) `ativo` | ![Inativo](https://img.shields.io/badge/-inativo-red?style=flat-square) `inativo`. Pratos inativos ou indisponíveis não podem compor novos pedidos.
- **Pedidos**: Avanço estrito (backend trava "pulos"): `criado` ➔ `em_preparo` ➔ `a_caminho` ➔ `entregue`.

---

## 🌐 Sistema e Base
Rotas de serviço da própria API.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Redireciona para o Docs `/docs`. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/docs` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Swagger UI contendo os esquemas REST abertos. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/health` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Retorna o status de conexão ao MongoDB e uptime do App. |

---

## 🔐 Autenticação
Responsável pelas validações e ciclo de vida da sessão JWT.

| Método | Endpoint | Permissão Base | Descrição e Validações |
|--------|----------|----------------|------------------------|
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/login` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Autentica via `email`/`senha`. Gera novos _Tokens_. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/signup` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Cria usuário padrão sem flag admin. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/logout` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Desloga um usuário destruindo Refresh token. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/refresh` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Rota que aceita o refresh token e devolve um novo JWT e renova sessão. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/recover` | ![Rate Limit](https://img.shields.io/badge/RateLmtd-Red?style=flat-square) | Envio de token de reset por e-mail no backend. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/password/reset` | ![Rate Limit](https://img.shields.io/badge/RateLmtd-Red?style=flat-square) | Substituição de senha via token `query` recuperado. |

---

## 👤 Usuários
Cadastros, fotos e controles de hierarquia.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/usuarios` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Lista usuários. Oculta senhas por padrão. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/usuarios/:id` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Busca cadastro específico. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/usuarios` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Cria conta contornando o signup (Apenas admin). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/usuarios/:id` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Atualiza dados textuais. Senhas aqui são ignoradas por segurança. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/usuarios/:id/status` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Bloqueio ou Liberação (Inativar/Ativar conta). |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/usuarios/:id` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Soft delete nativo. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/usuarios/:id/foto` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Upload de `multipart` pra avatar no bucket. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/usuarios/:id/foto` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Remoção e bypass pro fallback padrão. |

---

## 🏬 Restaurantes
Lojas e parceiros. 

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Feed de restaurantes (aceita query `?categoria=`). |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes/meus` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Retorna restaurantes cadastrados no perfil do logado. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes/:id` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Retorna página descritiva do Restaurante se não for inativo. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/restaurantes` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Abertura de parceria. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/restaurantes/:id` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Atualiza infos básicas e _Status_ da Loja (`aberto/fechado`). |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/restaurantes/:id` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Soft delete da Loja. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/restaurantes/:id/foto` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Upload da Logo/Capa. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/restaurantes/:id/foto` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Remoção. |

---

## 📑 Categorias
Agrupadores globais ("Hambúrguer", "Doces", "Japonês").

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/categorias` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Listagem da home page. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/categorias/:id` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Busca ID detalhado. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/categorias` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Cria nova tag (via Admin). |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/categorias/:id` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Modifica nome e tag. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/categorias/:id` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Remoção global de Categoria. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/categorias/:id/foto` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Vincula um ícone descritivo à Categoria. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/categorias/:id/foto` | ![Auth](https://img.shields.io/badge/Admin-1F6FEB?style=flat-square) | Volta a Categoria ao estado sem imagem. |

---

## 🍽️ Pratos e Cardápio
O conteúdo de venda vinculado ao restaurante.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/cardapio/:restauranteId` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | **Acesso Principal:** Retorna todos os pratos ativos da loja, por seções. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pratos` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Listagem crua (utilizada por dashboards administrativos). |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pratos/:id` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Renderiza modal detalhado de um item para usuário comprar. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/pratos` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Cadastro atrelado ao `restaurante_id` pertencente a ele. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/pratos/:id` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Edição (Inclusive inativando prato). |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/pratos/:id` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Inativa/Deleta o prato definitivamente. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/pratos/:id/foto` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Inserção de foto de apresentação (Ex: "Hamburguer Gourmet"). |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/pratos/:id/foto` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Exclusão de foto. |

---

## ➕ Adicionais (Grupos e Opções)
Motor de customização de pedidos (Ex: "Escolha 2 molhos" -> Grupos | "Ketchup", "Maionese" -> Opções).

| Entidade | Método | Endpoint / Params | Permissão | Ação |
|----------|--------|-------------------|-----------|------|
| **Grupos** | ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/adicionais/grupos/prato/:pratoId` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Retorna `min`/`max` obrigatoriedades. |
| **Grupos** | ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/adicionais/grupos/:id` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Buscar setup isolado. |
| **Grupos** | ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/adicionais/grupos` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Exige o vínculo com array de restaurantes/pratos. |
| **Grupos** | ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/adicionais/grupos/:id` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Edição de `min` e `max`. |
| **Grupos** | ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/adicionais/grupos/:id` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Remoção em conjunto. |
| **Opções** | ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/adicionais/opcoes/:grupoId` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Lista opções vinculadas (+ preço adicional). |
| **Opções** | ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/adicionais/opcoes` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Inserção de valor (Nome, Acréscimo Preço, GrupoId). |
| **Opções** | ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/adicionais/opcoes/:id` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Modifica o valor. |
| **Opções** | ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/adicionais/opcoes/:id` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Remove opção individual. |
| **Opções** | ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/adicionais/opcoes/:id/foto` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Upload Imagem adicional. |
| **Opções** | ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/adicionais/opcoes/:id/foto` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Remove Imagem adicional. |

---

## 📍 Endereços
Políticas restritas baseadas no Mongo Unique Indexing, dividindo Restaurante da Cartela do Usuário.

| Tipo da Rota | Método | Endpoint | Permissão | Resumo / Propósito |
|-------------|--------|----------|-----------|--------------------|
| **Usuários** | ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/usuarios/:usuarioId/enderecos` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Traz os Múltiplos endereços do utiizador. |
| **Usuários** | ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/usuarios/:usuarioId/enderecos` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Cadastra novo destino. **Regra**: Se `principal: true`, zera false os antigos (Cascata). |
| **Usuários** | ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/usuarios/:usuarioId/enderecos/:enderecoId` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Edição e reposicionamento. |
| **Usuários** | ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/usuarios/:usuarioId/enderecos/:enderecoId` | ![Auth](https://img.shields.io/badge/Owner/Admin-8957E5?style=flat-square) | Exclui rota do perfil. |
| **Rests.** | ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/restaurantes/:restauranteId/enderecos` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Recupera o local físico onde a Loja despacha/funciona. |
| **Rests.** | ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/restaurantes/:restauranteId/enderecos` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | **Hard Constraint**: A Loja pode emitir `409` bloqueando duplicidades. |
| **Rests.** | ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/restaurantes/:restauranteId/enderecos/:enderecoId` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Sobrescreve dados geográficos da loja. |
| **Rests.** | ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/restaurantes/:restauranteId/enderecos/:enderecoId` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Desvincula local da operação. |

---

## 🚚 Pedidos
As regras sensíveis e cálculos de impostos ocorrem inteiramente aqui pelo backend (ignorando inputs do client de "preço fixo").

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pedidos/meus` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | O Cliente visualiza o progresso no feed dele. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/pedidos/restaurante/:restauranteId` | ![Auth](https://img.shields.io/badge/Owner-8957E5?style=flat-square) | Dashboard do parceiro (Feed de produção da loja). |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/pedidos` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Carga principal de validação (`Pratos Ativos?`, `Addon Limits?`, `Restaurante Aberto?`). O preço exato é gerado e retornado. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/pedidos/:id/status` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Avanço linear pelo proprietário (`Pendente → Preparo → Caminho → Entregue`). |

---

## ⭐ Avaliações
Medição de confiança dos Restaurantes e Entregadores baseada em Notas atreladas ao Restaurante.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/avaliacoes/restaurante/:restauranteId` | ![Public](https://img.shields.io/badge/Público-2EA043?style=flat-square) | Renderiza pontuação e resenhas efetuadas. |
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/avaliacoes` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Dispara Nova Avaliação. |

---

## 🔔 Notificações
Gera caixa de entrada interna para avisos na tela (Polled) indicando mudança de status do pedido para o cliente, ou novo pedido para o lojista.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| ![POST](https://img.shields.io/badge/POST-238636?style=for-the-badge) | `/notificacoes` | ![System](https://img.shields.io/badge/Público/Sistema-2EA043?style=flat-square) | Endpoint utilizado para emitir alertas internos no painel. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/notificacoes` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Caixa de avisos do painel do usuário logado. |
| ![GET](https://img.shields.io/badge/GET-0052CC?style=for-the-badge) | `/notificacoes/:id` | ![Public](https://img.shields.io/badge/Aberto-2EA043?style=flat-square) | Resgata texto/metadata de uma notificação. |
| ![PATCH](https://img.shields.io/badge/PATCH-FF991F?style=for-the-badge) | `/notificacoes/:id/lida` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Seta o aviso pra estado `lida=true`. |
| ![DELETE](https://img.shields.io/badge/DELETE-E34F26?style=for-the-badge) | `/notificacoes/:id` | ![Auth](https://img.shields.io/badge/Auth-Obrigatório-B60205?style=flat-square) | Destrói alerta da caixa de correio do indivíduo. |
