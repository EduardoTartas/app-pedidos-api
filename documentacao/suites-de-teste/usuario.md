# Plano de Teste Endpoints: Usuários

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Usuario**.

---

### GET /usuarios

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Listagem Geral** | Lista usuarios autenticados em ordem alfabetica com paginacao padrao. | Requisição `GET /api/usuarios`. | Retorna HTTP `200` com os dados paginados e ordenados alfabeticamente. |
| **Filtros avançados** | Permite filtrar por nome, email, status, cpf, telefone e isAdmin. | Requisição `GET /api/usuarios?nome=joao&isAdmin=true`. | Retorna HTTP `200` listando apenas usuários que atendem a todos os critérios. |
| **Paginação customizada** | Respeita paginação customizada informada via query params. | Requisição `GET /api/usuarios?page=2&limite=5`. | Retorna HTTP `200` com os atributos `page` e `limit` correspondentes. |
| **Filtros sem resultado** | Retorna mensagem de nenhum usuario quando filtros não encontram nada. | Requisição `GET /api/usuarios` com filtros estritos. | Retorna HTTP `200` com lista de `docs` vazia. |
| **Validação de Query** | Bloqueia paginação errada (ex: página zero ou letras). | Requisição `GET /api/usuarios?page=0`. | Retorna HTTP `400` com falha de validação do Zod. |
| **Acesso Seguro** | Impede visualização por visitantes. | Requisição sem envio de token JWT. | Retorna HTTP `401` informando falta de autenticação. |

---

### GET /usuarios/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Busca de Perfil** | Busca usuario por id usando token JWT válido. | Requisição `GET /api/usuarios/{id_valido}`. | Retorna HTTP `200` ocultando dados sensíveis como senha. |
| **Validação de ID** | Bloqueia IDs que não sejam do tipo ObjectId. | Requisição `GET /api/usuarios/invalido`. | Retorna HTTP `400` com falha na validação do Zod. |
| **Usuário Inexistente** | Trata adequadamente quando ID não está no banco. | Requisição `GET /api/usuarios/{id_inexistente}`. | Retorna HTTP `404` informando que o usuário não foi encontrado. |
| **Acesso Protegido** | Requer token JWT do requerente. | Requisição `GET /api/usuarios/{id}` sem JWT. | Retorna HTTP `401`. |

---

### POST /usuarios

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação Segura** | Cria usuario autenticado e não devolve o hash de senha. | Requisição `POST /api/usuarios` (apenas Admin) com payload JSON completo. | Retorna HTTP `201` com os dados inseridos, sem expor `senha`. |
| **Senha Opcional** | Cria usuario sem senha (ex: caso crie para login social/futuro). | Requisição `POST /api/usuarios` omitindo campo `senha`. | Retorna HTTP `201` com a flag `hasPassword` correspondente. |
| **Corpo/Payload Vazio** | Validação primária. | Requisição enviando body nulo ou objeto vazio. | Retorna HTTP `400` listando todos os atributos requeridos. |
| **Dados Inválidos** | Bloqueia formatos indesejados. | Requisição `POST /api/usuarios` com email fora do padrão. | Retorna HTTP `400` com falha de validação. |
| **Duplicação de Email** | Verifica exclusividade de contas por email. | Requisição `POST /api/usuarios` com `email` já existente. | Retorna HTTP `400` bloqueando por registro duplicado. |
| **CPF Inválido / Duplicado** | Garante integridade do documento. | Requisição `POST` com CPF já existente ou malformado. | Retorna HTTP `400` bloqueando por violação de regra única. |

---

### PATCH /usuarios/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualiza Perfil** | Usuário atualiza seu próprio perfil (nome, cpf, telefone). Marca perfil como completo se os dados finais exigidos existirem. | Requisição `PATCH /api/usuarios/{meu_id}` com payload parcial. | Retorna HTTP `200` com `profileComplete` validado e dados atualizados. |
| **Admin Atualiza Outro** | Administrador atualiza outro usuario e pode alterar até a flag `isAdmin`. | Requisição `PATCH /api/usuarios/{outro_id}` usando token de admin. | Retorna HTTP `200` efetuando a alteração de permissão. |
| **Permissão Comum** | Usuario comum nao pode alterar `isAdmin` nem `senha` por esta rota. | Requisição `PATCH` enviando campo `isAdmin: true` como user comum. | Retorna HTTP `200` ignorando as flags protegidas ou retornando `403` caso seja estrito. |
| **Acesso Negado** | Usuário sem permissão para atualizar outro. | Requisição `PATCH /api/usuarios/{outro_id}` como user comum. | Retorna HTTP `403` informando proibição de acesso. |

---

### PATCH /usuarios/:id/status

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Ativação / Desativação** | Altera `status` da conta (ativo/inativo). | Requisição `PATCH /api/usuarios/{id}/status` com payload `{ status: 'inativo' }`. | Retorna HTTP `200` persistindo a mudança. Admin pode alterar o de outros; usuário comum apenas o próprio. |
| **Status Inválido** | Rejeita valores que não sejam de enum/padrão. | Requisição com payload `{ status: 'banido' }`. | Retorna HTTP `400` com erro do Zod para campo não reconhecido. |

---

### DELETE /usuarios/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Deleção Própria** | Usuário pode apagar sua própria conta e remover seus dados em cascata. | Requisição `DELETE /api/usuarios/{meu_id}` com token do próprio usuário. | Retorna HTTP `200` e dispara deleção limpa (limpeza de endereços e tokens). |
| **Admin Deleta** | Admin pode apagar conta de qualquer usuário do sistema. | Requisição `DELETE /api/usuarios/{outro_id}` usando token de Admin. | Retorna HTTP `200` realizando a deleção completa. |
| **Sem Permissão** | User comum tentado apagar conta alheia. | Requisição `DELETE` num ID que não lhe pertence. | Retorna HTTP `403` indicando proibição. |

---

### POST / DELETE /usuarios/:id/foto

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Upload de Foto (Self)** | Atualiza foto de avatar do próprio usuário. Aceita campo `imagem` ou `file` como `multipart/form-data`. | Requisição `POST /api/usuarios/{id}/foto` enviando buffer de imagem. | Retorna HTTP `200` com URL salva em `foto_perfil`. |
| **Upload (Admin)** | Admin atualiza foto de outro usuário. | Requisição `POST /api/usuarios/{outro_id}/foto` como Admin. | Retorna HTTP `200` com URL do MinIO. |
| **Remoção de Foto** | Apaga foto do armazenamento na nuvem e limpa URL. | Requisição `DELETE /api/usuarios/{id}/foto`. | Retorna HTTP `200` e zera `foto_perfil`. Retorna `404` se tentar apagar foto de usuário que não a possui. |
| **Controle de Acesso** | Impede gerenciar foto alheia sem ser admin. | Requisições em outro ID por conta comum. | Retorna HTTP `403`. |
