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
- **Autorização Baseada em Propriedade (Owner/Admin)**: Apenas detentores do recurso (proprietários de restaurantes ou usuários donos do próprio cadastro) ou Administradores têm permissão para realizar alterações, prevenindo vulnerabilidades de BOLA (Broken Object Level Authorization).
- **Rate Limit Estrito**: Rotas sensíveis (verificação e recuperação de senhas) estão sob rate limit forte.

### Convenção de Status (Regras de Negócio)
- **Restaurantes**: `aberto`, `fechado` ou `inativo`. Pedidos são bloqueados caso o status não seja `aberto`.
- **Pratos**: `ativo` ou `inativo`. Pratos inativos ou indisponíveis não podem compor novos pedidos.
- **Pedidos**: O avanço no fluxo de preparo é estrito, impossibilitando saltar etapas. O ciclo é: `criado` -> `em_preparo` -> `a_caminho` -> `entregue`.

---

## Sistema e Base

Rotas de serviço da própria API.
*Status da Suíte de Testes: Não Aplicável (Serviços Nativos).*

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/` | Público | Redireciona para o documento de especificações (`/docs`). |
| GET | `/docs` | Público | Interface do Swagger UI contendo os esquemas REST abertos. |
| GET | `/health` | Público | Retorna o status de conexão ao banco de dados MongoDB e o uptime da aplicação. |

---

## Autenticação

Responsável pelas validações e ciclo de vida da sessão JWT.
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/authRoutes.test.js`).

| Método | Endpoint | Permissão Base | Descrição e Validações |
|--------|----------|----------------|------------------------|
| POST | `/login` | Público | Autentica utilizando e-mail e senha. Gera novos tokens de sessão. |
| POST | `/signup` | Público | Criação de um novo usuário padrão (sem elevação de privilégio de administrador). |
| POST | `/logout` | Público | Encerra a sessão de um usuário invalidando o Refresh Token. |
| POST | `/refresh` | Público | Aceita o Refresh Token para devolver um novo JWT, renovando a sessão. |
| POST | `/recover` | Rate Limit Aplicado | Solicitação de recuperação de senha via envio de token por e-mail. |
| PATCH | `/password/reset` | Rate Limit Aplicado | Substituição de senha mediante a apresentação do token de recuperação via query parameter. |

---

## Usuários

Cadastros, envio de arquivos e controles de hierarquia.
**Status da Suíte de Testes**: Ausente no momento.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/usuarios` | Obrigatória (Auth) | Lista os usuários cadastrados (omite campos sensíveis como senhas). |
| GET | `/usuarios/:id` | Obrigatória (Auth) | Busca o cadastro específico de um usuário pelo identificador. |
| POST | `/usuarios` | Administrador | Permite a criação forçada de contas com definições administrativas. |
| PATCH | `/usuarios/:id` | Obrigatória (Auth) | Atualiza dados textuais do perfil. Senhas são ignoradas nesta via. |
| PATCH | `/usuarios/:id/status` | Administrador | Inativa ou reativa contas (Bloqueio/Liberação). |
| DELETE | `/usuarios/:id` | Proprietário/Administrador | Efetua o "soft delete" lógico da conta. |
| POST | `/usuarios/:id/foto` | Proprietário | Upload em formato `multipart/form-data` para o bucket de armazenamento da imagem do usuário. |
| DELETE | `/usuarios/:id/foto` | Proprietário | Remoção da foto de perfil, restabelecendo a imagem fallback padrão do sistema. |

---

## Restaurantes

Lojas e parceiros comerciais.
**Status da Suíte de Testes**: Ausente no momento.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/restaurantes` | Público | Feed global de restaurantes (aceita o query parameter `?categoria=`). |
| GET | `/restaurantes/meus` | Obrigatória (Auth) | Retorna os restaurantes associados ao perfil logado. |
| GET | `/restaurantes/:id` | Público | Retorna a página descritiva do Restaurante se não estiver com status inativo. |
| POST | `/restaurantes` | Obrigatória (Auth) | Abertura de parceria e cadastro do estabelecimento. |
| PATCH | `/restaurantes/:id` | Proprietário/Administrador | Atualiza informações básicas e o Status de operação (`aberto` ou `fechado`). |
| DELETE | `/restaurantes/:id` | Proprietário/Administrador | "Soft delete" do restaurante. |
| POST | `/restaurantes/:id/foto` | Proprietário/Administrador | Upload de logotipo e arte de capa. |
| DELETE | `/restaurantes/:id/foto` | Proprietário/Administrador | Exclusão dos arquivos de mídia vinculados ao restaurante. |

---

## Categorias

Agrupadores globais utilizados na classificação (Exemplo: "Hambúrguer", "Doces").
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/categoriaRoutes.test.js`).

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/categorias` | Público | Listagem utilizada na página inicial e feeds. |
| GET | `/categorias/:id` | Público | Busca de categoria pelo seu ID detalhado. |
| POST | `/categorias` | Administrador | Criação de uma nova tag categórica. |
| PATCH | `/categorias/:id` | Administrador | Modifica o nome da categoria. |
| DELETE | `/categorias/:id` | Administrador | Remoção de categoria do banco de dados global. |
| POST | `/categorias/:id/foto` | Administrador | Vincula um ícone descritivo em imagem à categoria. |
| DELETE | `/categorias/:id/foto` | Administrador | Remove o ícone associado à categoria. |

---

## Pratos e Cardápio

O conteúdo e os itens de venda vinculados aos restaurantes.
**Status da Suíte de Testes**: Ausente no momento.

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/cardapio/:restauranteId` | Público | Rota de acesso para exibição do menu de um estabelecimento listando pratos ativos agrupados. |
| GET | `/pratos` | Obrigatória (Auth) | Listagem bruta de todos os pratos (consumida geralmente por painéis de controle). |
| GET | `/pratos/:id` | Público | Busca detalhada das informações de um prato individual. |
| POST | `/pratos` | Proprietário | Cadastro do prato atrelado obrigatoriamente a um `restaurante_id`. |
| PATCH | `/pratos/:id` | Proprietário | Atualização dos atributos do prato (inclusive inativação de oferta). |
| DELETE | `/pratos/:id` | Proprietário | Exclusão definitiva ou lógica do prato no inventário. |
| POST | `/pratos/:id/foto` | Proprietário | Upload e processamento da foto de apresentação do produto. |
| DELETE | `/pratos/:id/foto` | Proprietário | Remoção do arquivo de imagem do produto. |

---

## Adicionais (Grupos e Opções)

O motor de customização modular dos pedidos (Exemplo: Grupos como "Escolha seu Molho" contendo opções como "Ketchup" e "Mostarda").
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/adicionalGrupoRoutes.test.js` e `src/test/routes/adicionalOpcaoRoutes.test.js`).

| Entidade | Método | Endpoint / Parâmetros | Permissão | Ação |
|----------|--------|-----------------------|-----------|------|
| Grupos | GET | `/adicionais/grupos/prato/:pratoId` | Público | Retorna informações de grupos e suas limitações de escolhas mínimas e máximas. |
| Grupos | GET | `/adicionais/grupos/:id` | Público | Buscar a configuração isolada de um grupo específico. |
| Grupos | POST | `/adicionais/grupos` | Proprietário | Criação de um novo grupo exigindo o vínculo com o ID do restaurante e do prato. |
| Grupos | PATCH | `/adicionais/grupos/:id` | Proprietário | Atualização dos critérios de `min` e `max` seleções possíveis. |
| Grupos | DELETE | `/adicionais/grupos/:id` | Proprietário | Remoção do grupo. |
| Opções | GET | `/adicionais/opcoes/:grupoId` | Público | Lista as alternativas vinculadas a um grupo específico, juntamente com o preço adicional de cada uma. |
| Opções | POST | `/adicionais/opcoes` | Proprietário | Inserção do valor (Nome, Acréscimo Preço, GrupoId). |
| Opções | PATCH | `/adicionais/opcoes/:id` | Proprietário | Modifica os dados da opção (valores adicionais, etc). |
| Opções | DELETE | `/adicionais/opcoes/:id` | Proprietário | Remove a opção individual. |
| Opções | POST | `/adicionais/opcoes/:id/foto` | Proprietário | Upload de imagem adicional associada à opção. |
| Opções | DELETE | `/adicionais/opcoes/:id/foto` | Proprietário | Remove a imagem adicional. |

---

## Endereços

Políticas baseadas em Indexação Única no banco, com regras de negócio dividindo Restaurantes da Cartela de Múltiplos Endereços dos Usuários.
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/enderecoRoutes.test.js`).

| Tipo | Método | Endpoint | Permissão | Resumo / Propósito |
|------|--------|----------|-----------|--------------------|
| Usuários | GET | `/usuarios/:usuarioId/enderecos` | Proprietário/Administrador | Retorna a lista de múltiplos endereços do utilizador. |
| Usuários | POST | `/usuarios/:usuarioId/enderecos` | Proprietário/Administrador | Cadastra novo destino. *Regra: Caso definido como `principal: true`, o sistema revoga este status dos demais endereços.* |
| Usuários | PATCH | `/usuarios/:usuarioId/enderecos/:enderecoId` | Proprietário/Administrador | Edição e reposicionamento. |
| Usuários | DELETE | `/usuarios/:usuarioId/enderecos/:enderecoId` | Proprietário/Administrador | Exclui a rota de endereço no perfil do usuário. |
| Restaurantes | GET | `/restaurantes/:restauranteId/enderecos` | Público | Recupera o local físico que abrange o raio de atuação e despacho da Loja. |
| Restaurantes | POST | `/restaurantes/:restauranteId/enderecos` | Proprietário | Cadastra o endereço do Restaurante. Restringe a inserção caso já exista um registro vinculado (retorna `409`). |
| Restaurantes | PATCH | `/restaurantes/:restauranteId/enderecos/:enderecoId` | Proprietário | Sobrescreve as propriedades demográficas da loja. |
| Restaurantes | DELETE | `/restaurantes/:restauranteId/enderecos/:enderecoId` | Proprietário | Desvincula o local de funcionamento das operações. |

---

## Pedidos

O pipeline sensível para recebimento, transação e cálculos de impostos da aplicação. Operações baseadas exclusivamente no backend, sem confiança em preços provenientes do client-side.
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/pedidoRoutes.test.js`).

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/pedidos/meus` | Obrigatória (Auth) | Visão do cliente sobre o progresso e histórico em seu perfil. |
| GET | `/pedidos/restaurante/:restauranteId` | Proprietário | Dashboard de recepção de demandas e produção do estabelecimento comercial. |
| POST | `/pedidos` | Obrigatória (Auth) | Ponto principal de validação para registro: Verifica se pratos estão ativos, respeitam limites de composição e avalia integridade de abertura do restaurante. Gera as precificações finais. |
| PATCH | `/pedidos/:id/status` | Obrigatória (Auth) | Permite que o proprietário avance o pedido sequencialmente (`pendente` -> `preparo` -> `caminho` -> `entregue`). |

---

## Avaliações

Métrica de reputação de parceiros baseada em análises e feedback vinculado à performance do restaurante perante o cliente.
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/avaliacaoRoutes.test.js`).

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| GET | `/avaliacoes/restaurante/:restauranteId` | Público | Exibe a pontuação e as análises efetuadas sobre um restaurante. |
| POST | `/avaliacoes` | Obrigatória (Auth) | Dispara o fluxo de submissão de nova avaliação a um pedido já consolidado e entregue. |

---

## Notificações

Sistema de comunicação em formato "polled" que gerencia avisos do ciclo do pedido tanto para clientes finais quanto para a visualização dos lojistas no painel logado.
**Status da Suíte de Testes**: **Coberta** (`src/test/routes/notificacaoRoutes.test.js`).

| Método | Endpoint | Permissão | Resumo / Propósito |
|--------|----------|-----------|--------------------|
| POST | `/notificacoes` | Sistema/Público | Endpoint utilizado pela malha do sistema para criar e distribuir alertas de mudança de eventos. |
| GET | `/notificacoes` | Obrigatória (Auth) | Caixa de avisos não lidos/lidos atrelada de forma privada ao ID do solicitante logado. |
| GET | `/notificacoes/:id` | Aberto/Público | Recupera a carga contendo texto e metadados detalhados de uma única notificação. |
| PATCH | `/notificacoes/:id/lida` | Obrigatória (Auth) | Modifica a flag booleana da notificação, processando-a como `lida=true`. |
| DELETE | `/notificacoes/:id` | Obrigatória (Auth) | Remove o histórico de notificação da caixa de mensagens do indivíduo. |
