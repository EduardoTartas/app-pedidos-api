# Plano de Teste Endpoints: Pratos e Cardápio

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Prato** e composição do Cardápio de Restaurantes.

---

### GET /pratos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Listagem por Dono (Dono de Restaurante)** | Lista todos os pratos (em ordem alfabética e com paginação) dos restaurantes que pertencem ao dono logado. | Requisição `GET /api/pratos` utilizando Token JWT do Proprietário. | Retorna HTTP `200` com os pratos cadastrados em seus restaurantes. |
| **Listagem Total (Admin)** | Administrador lista pratos de **todos os restaurantes** independentemente do dono. | Requisição `GET /api/pratos` com Token de Admin. | Retorna HTTP `200` exibindo todos os pratos da base. |
| **Filtros Dinâmicos** | Permite aplicar múltiplos filtros avançados cruzados (nome, status, seção e faixa de preço). | Requisição `GET /api/pratos?secao=Lanches&preco_min=10&preco_max=30`. | Retorna HTTP `200` retornando exclusivamente pratos dessa seção, dentro da faixa de preço estabelecida. |
| **Dono Sem Pratos** | Avalia se o tratador lógico devolve uma resposta íntegra ao não achar matches. | Requisição `GET` de usuário/dono que não cadastrou nada. | Retorna HTTP `200` com docs vazio e array limpo. |
| **Validação Strict de Query** | Protege engine de busca contra tipos não suportados. | Requisição `GET` com paginação corrompida. | Retorna HTTP `400` do Zod. |
| **Segurança de Acesso** | Esta rota não é de vitrine. Exige login (dono do produto). | Requisição sem token. | Retorna HTTP `401`. |

---

### GET /pratos/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Detalhes do Produto** | Busca prato por id em rota pública para exibição a clientes do delivery. | Requisição `GET /api/pratos/{id_publico}`. | Retorna HTTP `200` carregando informações detalhadas de preço, restrições e imagem. |
| **Desvios de Segurança** | Rejeita strings genéricas ou lixo no identificador. | Requisição para `GET /api/pratos/batata-frita`. | Retorna HTTP `400` por ObjectId inválido. |

---

### GET /cardapio/:restauranteId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Montagem do Cardápio Público** | Retorna cardapio público para clientes. Ele deve estar devidamente **agrupado por seção** (ex: "Bebidas", "Lanches") contendo apenas pratos *ativos*. | Requisição `GET /api/cardapio/{restaurante_id}` sem token. | Retorna HTTP `200`. O JSON de resposta é um objeto onde as chaves são as `secoes` (ex: `{"Bebidas": [...], "Pizzas": [...]}`). |
| **Restaurante Fechado / Sem Pratos** | Lida graciosamente com restaurantes inoperantes. | Requisição num restaurante que só tem produtos `ativo: false`. | Retorna HTTP `200` com objeto inteiramente vazio `{}`. |
| **Restaurante Inexistente** | Trata URL incorreta. | Requisição num `restaurante_id` que não consta no banco. | Retorna HTTP `404` NotFound. |

---

### POST /pratos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação pelo Dono** | Dono do restaurante insere novo prato. | Requisição `POST /api/pratos` payload `{nome, descricao, preco, secao, restaurante_id}` usando token do dono. | Retorna HTTP `201` salvando e devolvendo objeto com `_id`. |
| **Bypass de Admin** | Admin cria prato diretamente injetando-o no cardápio de qualquer loja. | Requisição via token de Admin. | Retorna HTTP `201`. |
| **Regra: Seção Customizada** | A seção preenchida no payload não tem vínculo estrito, ela é flexível para agrupamento. | Requisição enviando uma seção nova. | Retorna HTTP `201` agrupando futuramente nesta string inserida. |
| **Sequestro de Loja Rejeitado** | Dono tenta inserir prato em um restaurante que não é seu. | Requisição `POST` apontando o `restaurante_id` da concorrência. | Retorna HTTP `403` impedindo a manipulação. |
| **Validações Base** | Body vazio ou falta de nome/preço. | Requisição vazia ou com JSON deformado. | Retorna HTTP `400`. |

---

### PATCH /pratos/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização do Proprietário** | Edição de preco/nome/descricao/ativo do prato. | Requisição `PATCH /api/pratos/{id}` por dono válido. | Retorna HTTP `200` injetando modificações solicitadas. |
| **Bloqueio de Migração de Produto** | Não permite alterar o `restaurante_id` pelo payload, impedindo de roubar pratos ou alterar donos. | Requisição `PATCH` alterando `restaurante_id`. | Retorna HTTP `200` ignorando a chave corrompida. O prato continua atrelado à loja de origem. |
| **Falhas Base** | Interação com IDs falsos, formatos ruins, corpo vazio. | Requisição `PATCH` anômala. | Retorna `400` ou `404`. |
| **Restrições de ACL** | Acesso por dono de loja distinta ou anônimo. | Requisições com JWT impróprio. | Retorna `403` ou `401`. |

---

### DELETE /pratos/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Deleção Total (Cascata)** | Deleta o produto e roda ganchos para remover a foto associada no MinIO, além de desvincular grupos de adicionais associados. | Requisição `DELETE /api/pratos/{id}` via dono/admin. | Retorna HTTP `200`. Nenhuma imagem ou adicional órfão deve restar nos buckets ou bancos. |
| **Verificações de Segregação** | Bloqueia ataque de terceiros tentanto excluir o prato. | Requisição `DELETE` como usuário concorrente. | Retorna HTTP `403` Unauthorized. |

---

### Upload e Remoção de Foto de Produto (POST / DELETE /pratos/:id/foto)

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Upload via FormData** | Processa anexo de imagem de produto. | Requisição `POST /api/pratos/{id}/foto` enviando arquivo binário. | Retorna HTTP `200` retornando URL pública CDN. |
| **Regras de Envio** | Bloqueia submissões falhas. | Envio via `POST` sem bytes de payload multipart. | Retorna HTTP `400` com mensagem de erro amigável "Arquivo não anexado". |
| **Limpeza (DELETE)** | Remove a foto de prato específica. | Requisição `DELETE` para apagar foto. | Retorna HTTP `200` ou `404` se tentar apagar foto de prato que não possui `imagem_url`. |
| **Proteção ACL (Storage)** | Permissões em Storage Layer. | Requisições de arquivos via hackers/competidores `(403/401)`. | Bloqueio de ação com `403` confirmando defesa blindada. |
