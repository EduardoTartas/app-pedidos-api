# Plano de Teste Endpoints: Grupos de Adicionais

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Adicional Grupo** (Grupos de complementos de pratos).

---

### GET /adicionais/grupos/prato/:pratoId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Listagem por Prato** | Lista grupos ativos vinculados a um prato específico, em ordem alfabética. | Requisição `GET /api/adicionais/grupos/prato/{pratoId}`. | Retorna HTTP `200` com os grupos ativos e suas opções populadas. |
| **ID de Prato Inválido** | Protege engine do banco contra parse errors. | Requisição enviando string corrompida. | Retorna HTTP `400` com erro de ObjectId inválido. |
| **Prato Inexistente** | Trata requisição para pratos apagados. | Requisição enviando ObjectId que não consta no banco. | Retorna HTTP `404` Not Found. |

---

### GET /adicionais/grupos/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Busca por ID Público** | Busca os detalhes de um grupo de adicionais em rota pública. | Requisição `GET /api/adicionais/grupos/{id_valido}`. | Retorna HTTP `200` com os dados do grupo. |
| **ID Inválido / Inexistente** | Tratamento padrão de busca em banco. | Requisição enviando ID malformado ou inexistente. | Retorna HTTP `400` ou `404` adequadamente. |

---

### POST /adicionais/grupos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação de Grupo** | Cria grupo de adicional como dono do restaurante e vincula diretamente ao prato. | Requisição `POST /api/adicionais/grupos` enviando payload `{nome, obrigatorio, min, max, prato_id}` com token do dono. | Retorna HTTP `201` com grupo criado e associado ao prato. |
| **Payload Inválido** | Rejeita valores que não respeitam regras de negócio (ex: min > max). | Requisição com constraints incompatíveis. | Retorna HTTP `400` listando violações do Zod. |
| **Segurança de Rota** | Garante que visitantes não criem produtos. | Requisição sem token JWT. | Retorna HTTP `401` Unauthorized. |
| **Controle de Acesso** | Garante que um usuário comum ou dono de outro restaurante não injete grupos em pratos alheios. | Requisição com token de conta sem privilégio. | Retorna HTTP `403` Forbidden. |
| **Duplicação de Nome** | Impede grupos com mesmo nome no mesmo prato. | Requisição repetindo `nome` para o mesmo `prato_id`. | Retorna HTTP `409` Conflict. |
| **Prato Alvo Inexistente** | Verifica integridade relacional. | Requisição apontando para `prato_id` apagado. | Retorna HTTP `404` informando ausência do prato. |

---

### PATCH /adicionais/grupos/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização pelo Dono** | Atualiza campos do grupo (nome, restrições numéricas, status ativo). | Requisição `PATCH /api/adicionais/grupos/{id}`. | Retorna HTTP `200` com dados persistidos no banco. |
| **Bloqueios de Payload e Autenticação** | Proteções de endpoint restrito. | Requisição vazia, corrompida, sem token ou de outro usuário. | Retorna HTTP `400`, `401` ou `403` conforme o cenário violado. |
| **Grupo Inexistente** | Trata entidades órfãs ou apagadas concorrentemente. | Requisição em grupo que não existe mais. | Retorna HTTP `404`. |

---

### DELETE /adicionais/grupos/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Deleção em Cascata** | Exclui grupo, remove suas opções filhas do banco e desfaz o vínculo (array) com o prato. | Requisição `DELETE /api/adicionais/grupos/{id}` com token de dono. | Retorna HTTP `200`. Consulta no banco deve confirmar que opções também sumiram. |
| **Remoção de Vínculo via Query** | Desvincula grupo de um prato específico sem apagar o grupo inteiro (se compartilhado). | Requisição `DELETE /api/adicionais/grupos/{id}?prato_id={id}`. | Retorna HTTP `200` mantendo o grupo, mas apagando do array do prato. |
| **Múltiplos Bloqueios (ACL)** | Impede deleção maliciosa. | Requisições com JWT impróprio ou não formadas. | Retorna HTTP `401`, `403` ou `400` adequadamente. |
