# Plano de Teste Endpoints: Opções de Adicionais

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Adicional Opcao** (os itens individuais dentro de um grupo de adicionais).

---

### GET /adicionais/opcoes/:grupoId

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Listagem por Grupo** | Lista opções ativas vinculadas a um grupo específico, em ordem alfabética. | Requisição `GET /api/adicionais/opcoes/{grupoId}`. | Retorna HTTP `200` com os dados das opções disponíveis. |
| **Acesso Público** | Rota pública não requer autenticação, liberada para consulta do cardápio. | Requisição sem cabeçalho `Authorization`. | Retorna HTTP `200`. |
| **Falhas de Validação** | Proteção contra inputs incorretos no motor de busca. | Requisição enviando grupoId corrompido ou apontando para grupo deletado. | Retorna HTTP `400` (ID inválido) ou `404` (Não Encontrado). |

---

### POST /adicionais/opcoes

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Criação Segura** | Cria opção com payload válido mínimo como dono do restaurante. | Requisição `POST /api/adicionais/opcoes` enviando `{ nome, preco, grupo_id }`. | Retorna HTTP `201` com opção persistida e salva no grupo alvo. |
| **Preços Limiares** | Testa limite de borda para preço gratuito. | Requisição enviando `preco: 0`. | Retorna HTTP `201` salvando com sucesso. |
| **Rejeição de Preço Negativo** | Impede falhas contábeis no sistema. | Requisição enviando `preco: -5`. | Retorna HTTP `400` com erro de validação do Zod. |
| **Obrigatoriedades (Payload)** | Rejeita faltas de campos estruturais (nome, grupo_id). | Requisições omitindo campos vitais. | Retorna HTTP `400` listando as pendências. |
| **Prevenção de Duplicação** | Impede nome duplicado no mesmo grupo. | Requisição `POST` copiando nome de opção existente. | Retorna HTTP `409` (Conflict). |
| **Restrições Relacionais** | Rejeita apontamentos cegos. | Requisição apontando `grupo_id` inválido ou apagado. | Retorna HTTP `400` ou `404`. |
| **Bloqueios de Acesso (ACL)** | Protege a criação de lixo por hackers ou anônimos. | Requisições sem token, ou usuário sem permissão no restaurante atrelado ao grupo. | Retorna HTTP `401` ou `403`. |

---

### PATCH /adicionais/opcoes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Atualização Parcial** | Atualiza opção como dono (nome, preço, etc). | Requisição `PATCH /api/adicionais/opcoes/{id}`. | Retorna HTTP `200` aplicando as alterações. |
| **Atualiza Apenas Preço** | Altera um único campo numérico com sucesso. | Requisição `PATCH` enviando apenas `{ preco: 15.50 }`. | Retorna HTTP `200` mantendo o resto intacto. |
| **Conflito de Nomes** | Lida com duplicidade no rename. | Requisição renomeando para opção que já existe no mesmo grupo. | Retorna HTTP `409` (Conflict). |
| **Tratativas de Base** | Comportamento de segurança de borda. | IDs inválidos, options não existentes e acessos não autorizados. | Retorna `400`, `404`, `401` ou `403`. |

---

### DELETE /adicionais/opcoes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Exclusão Unitária** | Deleta opção como dono daquele restaurante. | Requisição `DELETE /api/adicionais/opcoes/{id}` usando token autenticado. | Retorna HTTP `200`. Objeto deve sumir do banco. |
| **Controles Rígidos** | Falhas esperadas ao tentar burlar o delete. | IDs errados, sem autenticação, conta sem vínculo, objeto inexistente. | Retorna `400`, `401`, `403` ou `404` respectivamente. |

---

### Upload e Remoção de Foto de Adicional (POST / DELETE /adicionais/opcoes/:id/foto)

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Upload de Foto (File ou Imagem)** | Faz upload de foto pelo campo `file` ou `imagem` como dono. | Requisição `POST /api/adicionais/opcoes/{id}/foto` via multipart. | Retorna HTTP `200` com a URL do storage remoto preenchida. |
| **Envio Sem Arquivo** | Bloqueia payloads de rede inúteis. | Requisição `POST` não anexando documento na chave correta. | Retorna HTTP `400`. |
| **Limpeza Limpa ou Suja** | Remove foto como dono. Mesmo quando exclusão em background (MinIO) falha (por timeout), a URL deve ser limpa do banco. | Requisição `DELETE /api/adicionais/opcoes/{id}/foto`. | Retorna HTTP `200`. A falha em nuvem lança log mas não quebra o front. |
| **Sem Foto Cadastrada** | Impede operações de deleção que não fazem sentido. | Requisição `DELETE` de foto quando URL já for vazia. | Retorna HTTP `400` de estado inconsistente. |
| **Proteção de Storage** | Garante que atacantes não encham nem esvaziem baldes S3. | Tentativas por users anônimos ou comuns sem permissões. | Retorna HTTP `401` ou `403`. |
