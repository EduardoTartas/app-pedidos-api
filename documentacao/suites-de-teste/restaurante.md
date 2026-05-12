# Plano de Teste Endpoints: Restaurantes

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Restaurante**.

---

### GET /restaurantes

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Listagem Pública Geral** | Lista restaurantes publicamente em ordem alfabética. | Requisição `GET /api/restaurantes` sem auth. | Retorna HTTP `200` com os restaurantes paginados (`page=1`, `limit=10`). |
| **Filtros avançados** | Permite filtrar por nome, status, categoria, entrega_gratis e avaliacao_minima. | Requisição `GET /api/restaurantes?categoria=id_cat&entrega_gratis=true`. | Retorna HTTP `200` listando apenas restaurantes aderentes. |
| **Ordenação e Paginação** | Ordena dinamicamente baseada no query param de sorteio. | Requisição `GET /api/restaurantes?ordenacao=avaliacao_desc&page=2`. | Retorna HTTP `200` listando do maior para o menor rating na página solicitada. |
| **Base Vazia / Filtros Vazios** | Lida com ausência de dados de forma amigável. | Requisição `GET` com filtros extremistas que não cruzam. | Retorna HTTP `200` com docs vazios e mensagem "Nenhum restaurante encontrado". |
| **Query Inválida** | Bloqueia paginação errada ou limites absurdos. | Requisição `GET /api/restaurantes?page=0`. | Retorna HTTP `400` com erro do validador Zod. |

---

### GET /restaurantes/meus

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Meus Restaurantes (Proprietário)** | Lista apenas restaurantes que pertencem ao dono autenticado. | Requisição `GET /api/restaurantes/meus` com token de Dono. | Retorna HTTP `200` populado apenas com os seus estabelecimentos. |
| **Listagem Total (Admin)** | Administrador tem bypass para listar restaurantes de todos os donos na mesma rota. | Requisição `GET /api/restaurantes/meus` com token de Admin. | Retorna HTTP `200` exibindo tudo. |
| **Nenhum Restaurante** | Caso usuário recém-criado acesse a rota. | Requisição sem nenhum cadastro na base vinculado. | Retorna HTTP `200` comunicando a inexistência de cadastros. |
| **Sem Autenticação** | Rota estritamente protegida. | Requisição `GET` sem token JWT. | Retorna HTTP `401` com erro de autorização. |

---

### GET /restaurantes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Busca de Perfil de Restaurante** | Busca restaurante público para exibição de cardápio / detalhes. | Requisição `GET /api/restaurantes/{id}`. | Retorna HTTP `200` com os atributos completos (incluindo categorias populadas). |
| **ID Inválido** | Protege Mongoose contra parse errors. | Requisição `GET /api/restaurantes/123`. | Retorna HTTP `400` listando erro ObjectId. |
| **Inexistente** | Trata busca de loja desativada/apagada. | Requisição com ObjectId bem formado, mas não existente. | Retorna HTTP `404` (Not Found). |

---

### POST /restaurantes

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação Segura** | Cria restaurante e vincula o `user_id` do payload do token JWT como `dono_id`. O status inicial padrão deve ser fechado/inativo até aprovação. | Requisição `POST /api/restaurantes` enviando `{ nome, cnpj, categorias: [...] }`. | Retorna HTTP `201` com os dados inseridos. |
| **Validação de CNPJ** | Valida se a string atende a regras reais de CNPJ brasileiro. | Requisição com `cnpj: "12.345.678/0001-99"`. | Retorna HTTP `201` se válido, ou `400` se malformado. |
| **Duplicação Restrita** | Garante que o mesmo CNPJ não será cadastrado duas vezes, assim como nome. | Requisição com CNPJ de loja já existente. | Retorna HTTP `409` (Conflict). |
| **Categorias Inválidas** | Vincula a tabela de Categorias. | Requisição enviando ID de categoria que não existe. | Retorna HTTP `400` indicando chave estrangeira quebrada. |
| **Requerimento de Autenticação e Payload** | Exige sessão e dados robustos. | Requisição vazia `{}`, incompleta, ou sem token JWT. | Retorna HTTP `400` ou `401`. |

---

### PATCH /restaurantes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização Própria** | Dono atualiza informações cadastrais de seu restaurante. | Requisição `PATCH /api/restaurantes/{id}` do seu restaurante com payload parcial. | Retorna HTTP `200` atualizando apenas os campos alterados. |
| **Bypass de Admin** | Admin pode editar dados de restaurantes de outros usuários. | Requisição no restaurante de terceiros usando token de admin. | Retorna HTTP `200`. |
| **Proteção de Dono** | Impede sequestro de restaurante alterando o `dono_id` via payload. | Requisição enviando `dono_id` falso. | Retorna HTTP `200`, mas desconsiderando/limpando a alteração de propriedade. |
| **Conflitos de Unique** | Garante regras unique na alteração. | Requisição alterando CNPJ/Nome para um que já existe. | Retorna HTTP `409`. |
| **Sem Permissão** | Donos só mexem nas suas próprias empresas. | Requisição de restaurante alheio por user não admin. | Retorna HTTP `403` bloqueando acesso. |

---

### DELETE /restaurantes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Exclusão de Loja** | Apaga o restaurante (como dono) e roda hooks de deleção em cascata (foto, endereço, pratos). | Requisição `DELETE /api/restaurantes/{id}`. | Retorna HTTP `200` confirmando deleção profunda no backend. |
| **Exclusão por Admin** | Admin derruba qualquer loja irregular. | Requisição com token de Admin. | Retorna HTTP `200`. |
| **Restrições** | Proíbe deleção de terceiros e rejeita IDs incorretos. | Acessos com token comum, sem token, ID quebrado. | Retorna HTTP `403`, `401` ou `400`. |

---

### Upload e Remoção de Logo (POST / DELETE /restaurantes/:id/foto)

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Upload de Logo (Self/Admin)** | Atualiza a foto/logo do restaurante fazendo proxy para bucket externo. | Requisição `POST /api/restaurantes/{id}/foto` via `multipart/form-data`. | Retorna HTTP `200` preenchendo o campo de URL. |
| **Regras Rígidas de Deleção** | Usuários só gerenciam imagens das suas empresas, ou Admin faz bypass. | `DELETE /api/restaurantes/{id}/foto` do próprio estabelecimento. | Retorna HTTP `200` limpando o campo e acionando bucket externo. Retorna `404` caso a loja não tenha imagem ativa. |
