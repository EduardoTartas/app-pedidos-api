# Plano de Teste Endpoints: Endereços

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Endereco** (Gerenciamento de localizações para usuários e restaurantes).

---

### GET /usuarios/:usuarioId/enderecos e /restaurantes/:restauranteId/enderecos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Lista de Usuário (Dono)** | Lista enderecos do próprio usuário com o `principal` primeiro, seguido por ordem alfabética de label ou criação. | Requisição `GET /api/usuarios/{meu_id}/enderecos`. | Retorna HTTP `200` com a lista ordenada favorecendo o endereço ativo/padrão. |
| **Lista de Usuário (Admin)** | Administrador lista enderecos de qualquer usuario sem bloqueio de ACL. | Requisição `GET /api/usuarios/{outro_id}/enderecos` como Admin. | Retorna HTTP `200`. |
| **Lista Vazia** | Retorna lista vazia quando usuario nao possui enderecos. Trata retorno nulo do banco adequadamente sem quebrar. | Requisição de user sem casas cadastradas. | Retorna HTTP `200` com `docs` contendo `[]`. |
| **Busca de Restaurante (Pública)** | Busca endereco único de restaurante em rota pública. | Requisição `GET /api/restaurantes/{id}/enderecos` sem JWT. | Retorna HTTP `200` com o objeto único do endereço do restaurante (sem arrays). Se não tiver, retorna nulo mas `200`. |
| **Bloqueios de Acesso a Endereço Pessoal** | Protege informações de localização dos clientes. | Requisições a users alheios por users comuns ou sem token. | Retorna HTTP `403` ou `401`. Se o ID da url for corrompido, retorna `400`. |

---

### POST /usuarios/:usuarioId/enderecos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação de Endereço Residencial** | Cria endereco para o próprio usuário vinculando `dono_id` no banco. | Requisição `POST /api/usuarios/{id}/enderecos` enviando payload `{ rua, numero, bairro, cidade, uf, cep, principal: true }`. | Retorna HTTP `201`. |
| **Manutenção do Status Principal** | Ao criar endereco marcado como `principal: true`, o service localiza e desmarca dinamicamente os demais do usuário. | Criação do 2º endereço como principal. | Retorna HTTP `201`. O anterior vira `principal: false`. |
| **Restrições de Label Único** | Label (ex: "Casa", "Trabalho") duplicado para o mesmo usuário levanta erro. Mesmo label é permitido para usuários diferentes. | Criação de "Casa" duas vezes para user X e uma para user Y. | Retorna `409` no segundo de X, mas `201` no Y. |
| **Validação Strict de Payload** | Avalia formato do CEP, obrigatoriedades de cidade e UF. | Payload invalido, corpo vazio ou usuário inexistente. | Retorna `400` listando violações do Zod ou `404` NotFound. |

---

### POST /restaurantes/:restauranteId/enderecos

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Sede da Empresa** | Cria endereco como dono do restaurante ou administrador. | Requisição `POST /api/restaurantes/{id}/enderecos`. | Retorna HTTP `201`. O endereço nasce com `referencia: "Restaurante"`. |
| **Unicidade de Matriz** | Restaurante com endereço existente não pode criar outro local simultaneamente (1 pra 1). | Requisição `POST` num restaurante que já tem endereço. | Retorna HTTP `409` Conflict (Restaurante já possui endereço). |

---

### PATCH /usuarios/:usuarioId/enderecos/:enderecoId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização do Usuário** | Atualiza endereco do próprio usuário. Ao atualizar para principal (`true`), desmarca os demais do usuário (Toggle behavior). | Requisição `PATCH` alterando os dados. | Retorna HTTP `200` aplicando as alterações. |
| **Defesa contra Injeção Relacional** | Não permite alterar vínculo do endereço (referencia, dono_id) pelo payload malicioso. | Envio de `{ dono_id: "fake" }` no payload. | Retorna HTTP `200` mantendo a segurança do relacionamento. |
| **Atualização Leve** | Atualiza somente complemento sem mexer em label ou principal e sem acionar conflito de label. | Requisição de edição de complemento. | Retorna HTTP `200`. |

---

### PATCH /restaurantes/:restauranteId/enderecos/:enderecoId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização da Sede** | Atualiza endereco como dono do restaurante ou admin. | Requisição `PATCH`. | Retorna HTTP `200`. |
| **Proteção Estrutural** | Não permite alterar vínculo nem o flag de "principal" (irrelevante para restaurantes) pelo payload. | Requisições tentando forçar flags estruturais. | Retorna HTTP `200` ignorando e sanitizando o payload. |
| **Controle de Rota Cruzada** | Endereço de outro restaurante acessado pelo dono logado. | Acesso indevido. | Retorna HTTP `403`. |

---

### DELETE /usuarios/:usuarioId/enderecos/:enderecoId (e Restaurantes)

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Remoção Segura** | Deleta endereco do próprio usuário / próprio restaurante e recalcula flag "principal" (fallback) caso o apagado fosse o oficial. | Requisição `DELETE`. | Retorna HTTP `200` com exclusão efetuada. |
| **Falhas Controladas** | IDs errados, Endereço de outro dono, ou Endereço Inexistente. | Acessos corrompidos ou apagamento fantasma. | Retorna `400`, `403` ou `404` sucessivamente e não `500` (crash). |
