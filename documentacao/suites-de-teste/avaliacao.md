# Plano de Teste Endpoints: Avaliações

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Avaliação** (Reviews de Restaurantes e Pedidos).

---

### GET /avaliacoes/restaurante/:restauranteId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Listagem Pública** | Lista avaliações de um restaurante existente. | Requisição `GET /api/avaliacoes/restaurante/{id}` sem token. | Retorna HTTP `200` listando avaliações associadas àquela loja. |
| **Paginação Padrão e Custom** | Retorna estrutura paginada com valores padrão (`limit=10`, `page=1`), mas respeita customizações. | Requisição `GET` passando `page=2&limite=5`. | Retorna HTTP `200` contendo 5 itens na página 2 com a flag correta. |
| **Restaurante Inexistente** | Comportamento silencioso: se buscar reviews de um restaurante que não existe, apenas retorna lista vazia. | Requisição `GET` num restaurante fantasma. | Retorna HTTP `200` com `docs: []`. |
| **Id Malformado** | Protege pipeline do MongoDB. | Requisição `GET` com id "invalido". | Retorna HTTP `422` (Unprocessable Entity) disparado pelo validador Zod. |

---

### POST /avaliacoes

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação de Review** | Cria avaliação com payload válido (minimo: `nota`, `pedido_id`). Opcionalmente aceita `descricao`. | Requisição `POST /api/avaliacoes` via usuário autenticado dono do pedido. | Retorna HTTP `201` salvando e processando média do restaurante via triggers em background. |
| **Limites da Nota (0 a 6)** | Valida integridade do sistema de 5 estrelas. | Requisição com notas inválidas (ex: -1 ou 6) e notas não-inteiras (ex: 4.5). | Retorna HTTP `422` bloqueando o preenchimento corrompido via schema do Zod. |
| **Obrigatoriedades Mínimas** | Rejeita payloads nulos. | Envio vazio ou sem pedido ou sem nota. | Retorna HTTP `422`. |
| **Limite de Texto** | Garante que descricao fique abaixo de 500 caracteres. | Envio de `descricao` longa. | Retorna HTTP `422`. |
| **Controle de Autenticação** | Protege Rota. | Acesso sem JWT. | Retorna HTTP `401`. |
| **Proteção de Autoria** | Impede usuário avaliar um pedido que não é dele. | Acesso com token de user diferente do comprador. | Retorna HTTP `403` (Forbidden). |
| **Validação de Entrega** | Só permite avaliação de pedidos finalizados/entregues. | Acesso para avaliar pedido em status `pendente` ou `em_preparo`. | Retorna HTTP `400` listando "Pedido não finalizado". |
| **Prevenção de Duplicação** | Tentar avaliar pedido já avaliado. | Segundo POST para o mesmo pedido. | Retorna HTTP `409` (Conflict). |
| **Pedido Inexistente** | Tentar avaliar identificador apagado. | POST apontando para order não achada. | Retorna HTTP `404` NotFound. |
