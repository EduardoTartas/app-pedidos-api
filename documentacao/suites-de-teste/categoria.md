# Plano de Teste Endpoints: Categorias

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Categoria**.

---

### GET /categorias

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Lista paginação padrão** | Deve listar categorias ordenadas alfabeticamente. | Requisição `GET /api/categorias` sem query params. | Retorna HTTP `200` com objeto paginado (`docs`, `totalDocs`, `page=1`, `limit=10`). Array ordenado. |
| **Filtra por nome** | Deve buscar categorias ignorando acentos e case. | Requisição `GET /api/categorias?nome=acai`. | Retorna HTTP `200` contendo apenas as categorias que combinam com o termo. |
| **Filtra por inativo** | Deve listar categorias desativadas. | Requisição `GET /api/categorias?ativo=false`. | Retorna HTTP `200` com categorias onde `ativo=false`. |
| **Paginação customizada** | Deve respeitar limites e páginas passadas via query. | Requisição `GET /api/categorias?page=2&limite=1`. | Retorna HTTP `200` com `page=2`, `limit=1` e apenas 1 item em `docs`. |
| **Validação de Query** | Deve bloquear valores inválidos na paginação. | Requisição `GET /api/categorias?page=0`. | Retorna HTTP `400` com erro de validação do Zod (página deve ser >= 1). |
| **Acesso Público** | Rota deve estar aberta sem token JWT. | Requisição `GET /api/categorias` sem header `Authorization`. | Retorna HTTP `200` normalmente. |

---

### GET /categorias/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Busca por ID** | Deve retornar os detalhes de uma categoria pública. | Requisição `GET /api/categorias/{id_valido}`. | Retorna HTTP `200` com o objeto da categoria preenchido corretamente. |
| **ID Inválido** | Rejeita IDs que não sejam do tipo ObjectId. | Requisição `GET /api/categorias/123`. | Retorna HTTP `400` com erro de formato de ObjectId. |
| **Não encontrada** | Rejeita IDs válidos que não existem no banco. | Requisição `GET /api/categorias/{id_inexistente}`. | Retorna HTTP `404` informando recurso não encontrado. |

---

### POST /categorias

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação com Sucesso** | Administrador deve conseguir criar categoria. | Requisição `POST /api/categorias` como Admin. Envia payload JSON `{ nome, icone_categoria, ativo }`. | Retorna HTTP `201` com o objeto salvo no banco contendo `_id` e atributos. |
| **Payload Inválido** | Rejeita campos faltando ou inválidos. | Requisição `POST /api/categorias` como Admin enviando nome muito curto. | Retorna HTTP `400` com detalhes de erro de validação do Zod. |
| **Sem Autenticação** | Protege rota de visitantes anônimos. | Requisição `POST /api/categorias` sem enviar JWT. | Retorna HTTP `401` com erro de "Não autorizado". |
| **Sem Permissão (Forbidden)** | Rejeita criação por usuário comum. | Requisição `POST /api/categorias` com JWT de usuário normal. | Retorna HTTP `403` informando acesso negado. |
| **Nome Duplicado** | Evita concorrência e lixo no banco. | Requisição `POST /api/categorias` enviando `nome` já existente. | Retorna HTTP `400` com erro de duplicação/conflito. |

---

### PATCH /categorias/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização parcial** | Administrador pode atualizar o nome/status. | Requisição `PATCH /api/categorias/{id}` como Admin. Payload parcial `{ nome: 'Novo', ativo: false }`. | Retorna HTTP `200` com o objeto atualizado refletindo os novos dados. |
| **ID Inválido** | Rejeita atualização de formato inválido. | Requisição `PATCH /api/categorias/abc`. | Retorna HTTP `400` com erro de formato ObjectId. |
| **Payload Inválido** | Rejeita dados fora das regras de negócio. | Requisição `PATCH /api/categorias/{id}` enviando dados incorretos. | Retorna HTTP `400` listando as falhas do Zod. |
| **Sem Autenticação** | Protege rota contra visitantes. | Requisição `PATCH /api/categorias/{id}` sem JWT. | Retorna HTTP `401`. |
| **Sem Permissão** | Impede usuário comum de editar. | Requisição `PATCH /api/categorias/{id}` como User. | Retorna HTTP `403`. |
| **Não encontrada** | Lida com categoria apagada. | Requisição `PATCH /api/categorias/{id_inexistente}`. | Retorna HTTP `404`. |

---

### DELETE /categorias/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Deleção com Sucesso** | Exclui do banco de dados permanentemente. | Requisição `DELETE /api/categorias/{id}` como Admin. | Retorna HTTP `200`. Consulta no banco deve confirmar ausência. |
| **ID Inválido** | Impede exclusões desformatadas. | Requisição `DELETE /api/categorias/inv`. | Retorna HTTP `400`. |
| **Acesso Negado** | Usuários/Anônimos não podem apagar. | Requisição sem token ou token user comum. | Retorna HTTP `401` ou `403`. |
| **Não encontrada** | Evita falsos positivos. | Requisição `DELETE /api/categorias/{id_inexistente}`. | Retorna HTTP `404`. |

---

### Upload e Remoção de Ícone (POST / DELETE /categorias/:id/foto)

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Upload de Imagem** | Atualiza ícone e faz proxy via `express-fileupload`. | Requisição `POST /api/categorias/{id}/foto` (multipart/form-data) anexando arquivo `file` ou `imagem`. | Retorna HTTP `200` e url do MinIO salva em `icone_categoria`. |
| **Sem arquivo (Upload)** | Rejeita envio de form vazio. | Requisição `POST` sem anexos. | Retorna HTTP `400` exigindo a foto. |
| **Remoção de Ícone** | Deleta objeto do bucket e limpa URL no banco. | Requisição `DELETE /api/categorias/{id}/foto` como Admin. | Retorna HTTP `200` e atributo `icone_categoria` fica vazio (`""`). |
| **Categoria Sem Ícone** | Evita deleção redundante. | Requisição `DELETE` de foto quando a url já está vazia. | Retorna HTTP `404` informando que o ícone não existe. |
| **Segurança das Fotos** | Apenas admins gerenciam as fotos. | Requisição `POST/DELETE` como user sem permissão. | Retorna HTTP `401` ou `403`. |
