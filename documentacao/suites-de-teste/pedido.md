# Plano de Teste Endpoints: Pedidos

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Pedido** (Core transacional do Delivery e fluxos de caixa/carrinho).

---

### GET /api/pedidos/meus

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Histórico do Usuário** | Aplica filtros e retorna os pedidos efetuados pelo usuário autenticado. | Requisição `GET /api/pedidos/meus` com token de Cliente. | Retorna HTTP `200` exibindo pedidos em ordem cronológica (mais recentes primeiro). |
| **Histórico Vazio** | Retorna nenhum pedido quando não há histórico. | Requisição `GET` de usuário recém-criado. | Retorna HTTP `200` contendo lista vazia. |

---

### GET /api/pedidos/restaurante/:restauranteId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Gestão de Comandas (Dono)** | Retorna pedidos encontrados atrelados ao restaurante (Dashboard de Vendas). | Requisição `GET /api/pedidos/restaurante/{id}` utilizando token do proprietário do restaurante. | Retorna HTTP `200` com toda a fila de pedidos direcionada àquele restaurante específico. |
| **Restrição de Filtros (Status)** | Filtros muito rígidos avisam a inexistência de matchings. | Requisição enviando query parameters de filtros (ex: status inválido ou conflitante). | Retorna HTTP `200` ou mensagem controlada (de filtro) orientando ausência de ordens. |

---

### POST /api/pedidos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Finalização de Compra (Checkout)** | Cria pedido, recalcula no backend todos os valores de preços das opções e taxas de frete para evitar injeções maliciosas via client-side. | Requisição `POST /api/pedidos` com carrinho `{ restaurante_id, itens: [{prato_id, quantidade, adicionais}], endereco_entrega_id }`. | Retorna HTTP `201` com o Pedido processado, gerando ID e subtotal/total coerente. |
| **Segurança do Carrinho** | Corpo vazio ou anômalo retorna erro direto de validação (Zod). | Envio de JSON vazio ou itens corrompidos. | Retorna HTTP `400` impedindo pedidos cegos. |
| **Expediente** | Rejeita tentativa de gerar comandas em restaurante fechado (status = inativo/fechado). | Requisição para loja onde `ativo: false` ou fechada. | Retorna HTTP `400` com erro de negócio. |
| **Isolamento de Restaurante** | Rejeita prato de outro restaurante. Impede que usuários injetem pratos da Concorrência X no pedido do Restaurante Y. | Payload misturando pratos de fontes diferentes. | Retorna HTTP `400` com erro relacional explícito. |
| **Estoque e Validade** | Rejeita tentativa de compra de prato inativo. | Payload incluindo ID de produto inativo. | Retorna HTTP `400`. |
| **Obrigatoriedades (Adicionais)** | Exige adicional obrigatório do prato, impedindo que os usuários burlem etapas fundamentais. | Criação de pedido de prato cuja opção de grupo é requerida (ex: Tamanho da Pizza). | Retorna HTTP `400` relatando a falta do anexo obrigatório. |
| **Limites Inferiores (Adicionais)** | Rejeita envio de quantidade de opcionais abaixo do mínimo estipulado pelo grupo (ex: Mínimo de 1 carne). | Envio aquém do `min`. | Retorna HTTP `400`. |
| **Limites Superiores (Adicionais)** | Rejeita envio de opcionais acima do limite máximo estabelecido pelo dono. | Envio de 5 opcionais em grupo cujo `max: 2`. | Retorna HTTP `400` por excedente numérico. |

---

### PATCH /api/pedidos/:id/status

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Progressão de Fluxo** | Atualiza pedido para `em_preparo` quando acionado pelo dono do restaurante (ou Admin). | Requisição `PATCH /api/pedidos/{id}/status` contendo `{ status: 'em_preparo' }`. | Retorna HTTP `200` aplicando a mudança de flag do workflow de entrega. |
| **Tratativa de Input** | Corpo vazio. | Tentativa sem especificar novo status. | Retorna HTTP `400` (Erro de Validação). |
| **Proteção de Irreversibilidade** | Não cancela pedido entregue (Status final). Impede distorções no fluxo. | Tentativa de aplicar `{ status: 'cancelado' }` num ID de pedido que já seja `entregue`. | Retorna HTTP `400` proibindo regressão. |
| **Transições Ilegais** | Rejeita transição fora do fluxo (ex: passar de Pendente para Entregue magicamente). | Envio de jump-status proibido. | Retorna HTTP `400` com erro de pipeline / fluxo. |
| **Segregação de Autoria (Cancelamento)** | Rejeita cancelamento por usuario sem relação com o pedido (Hacker). O cancelamento só vale pro comprador ou pro dono do restaurante. | Requisição de user desvinculado. | Retorna HTTP `403` (Acesso Negado). |
