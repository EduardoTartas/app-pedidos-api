# Plano de Teste Endpoints: Notificações

Esta documentação detalha os testes de integração (endpoints) implementados para a entidade **Notificacao** (Sistema de avisos aos usuários e log de eventos).

---

### GET /notificacoes

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Caixa de Entrada (Minhas)** | Lista as notificações do próprio usuário ordenadas sempre da mais recente para a mais antiga. | Requisição `GET /api/notificacoes` com token JWT. | Retorna HTTP `200` listando dados no formato paginado. |
| **Filtros de Leitura** | Filtra notificações baseada na flag de visualização. | Requisições enviando `?lida=true` ou `?lida=false`. | Retorna HTTP `200` retornando exclusivamente os alertas com status compatível. Valores diferentes de booleanos explícitos são simplesmente ignorados. |
| **Filtros por Tipo** | Filtra por categorias do Enum (ex: 'INFO', 'PEDIDO'). | Requisição enviando `?tipo=PEDIDO`. | Retorna HTTP `200` limitando as notificações àquele assunto. Ignora o filtro caso envie um tipo nulo ou vazio. |
| **Interações com Filtro Vazio** | Retorna lista vazia caso não haja matches precisos. | Requisições com filtros extremamente estritos (ex: `tipo` sem registros não-lidos). | Retorna HTTP `200` com `docs` contendo lista vazia. |
| **Paginação Restritiva** | Respeita paginação customizada, mas limita o burst máximo (proteção DDoS/Load). | Requisição `GET` com limite abusivo (ex: `?limite=999`). | Retorna HTTP `200`, limitando paginação a no máximo 100 registros obrigatoriamente. |
| **Segurança** | Impede acesso de anônimos à lista. | Requisição sem token de autenticação. | Retorna HTTP `401`. |

---

### GET /notificacoes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Consulta Individual** | Busca os detalhes de uma notificacao lida/não-lida do usuário autenticado. | Requisição `GET /api/notificacoes/{id}`. | Retorna HTTP `200` listando a entidade singular e formatada. |
| **Invasão de Privacidade** | Notificacao de outro usuario (sigilo relacional). | Consulta por ID apontando para a caixa de mensagens de terceiros. | Retorna HTTP `403` informando Forbidden. |
| **Ausência / ID Inválido** | Controle de erros padrão. | IDs falsos e registros deletados. | Retorna HTTP `400` e `404` sucessivamente. |

---

### POST /notificacoes

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Disparo de Evento** | Cria notificacao injetando mensagem diretamente na conta de um usuário (sistema interno/admin). | Requisição `POST /api/notificacoes` enviando payload válido (`usuario_id`, `mensagem`, `tipo`). | Retorna HTTP `201`. |
| **Opcionalidades** | Garante suporte aos campos opcionais (`pedido_id`, `lida_em`, etc). | Requisição enviando campos extras de rastreio de pedido. | Retorna HTTP `201` populando a entidade e permitindo deep links. |
| **Payload Estrito** | Bloqueia falhas na inserção. | Payload invalido (faltando campos vitais) ou apontando para IDs não-conformes no `usuario_id`. | Retorna HTTP `400`. |
| **Proteção de Criação** | Restringe criação. | Acesso sem JWT ao endpoint injetor de eventos. | Retorna HTTP `401`. |

---

### PATCH /notificacoes/:id/lida

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Marcar como Lida** | Marca notificação como visualizada e popula o campo data. | Requisição `PATCH /api/notificacoes/{id}/lida`. | Retorna HTTP `200` aplicando flag `lida = true` e preenchendo o `lida_em`. |
| **Idempotência de Ação** | Retorna a notificação sem falhar quando já está lida. | Chamada subsequente idêntica de PATCH. | Retorna HTTP `200` e evita gravação de banco caso o estado não tenha mudado. |
| **Tentativa de Acesso Furtivo** | Acesso às notificações da conta alheia. | Tentativa de marcar alertas de terceiros como lidos. | Retorna HTTP `403`. |
| **Padrões de Erro** | Respeita restrições lógicas. | ID Invalido, NotFound e Falta de JWT. | Retorna `400`, `404`, `401`. |

---

### DELETE /notificacoes/:id

| Cenário / Funcionalidade | Comportamento Esperado | Verificações (Execução) | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Limpeza de Caixa de Entrada** | Deleta notificação do usuário autenticado permanentemente. | Requisição `DELETE /api/notificacoes/{id}`. | Retorna HTTP `200`. Consulta interna confirmará a supressão do aviso. |
| **Barreira de Usuários** | Impede limpeza maliciosa da conta de outras pessoas. | Deletes falsos em contas de terceiros. | Retorna HTTP `403` (Proibido). |
| **Padrões de Erro** | Respeita restrições lógicas comuns. | ID Invalido, NotFound e Falta de JWT. | Retorna `400`, `404`, `401`. |
