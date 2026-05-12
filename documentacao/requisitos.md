# Especificação Funcional e Tecnológica

Este documento consolida os **Requisitos Funcionais (RF)** e **Requisitos Não Funcionais (RNF)** da API de Delivery.

---

## Requisitos Funcionais

- **[RF00] Autenticação e Gestão de Acesso**
  O sistema deve gerenciar o acesso via e-mail e senha com tokens JWT e Refresh Token, incluindo recuperação de conta e invalidação de sessões.

- **[RF01] Gerenciamento de Restaurantes**
  O sistema deve permitir o cadastro de lojas via CNPJ válido, possibilitando o controle de status operacional e a classificação por categorias globais.

- **[RF02] Gestão de Cardápio e Customização**
  O sistema deve possibilitar a criação de cardápios com fotos e grupos de adicionais, respeitando regras de preços e limites mínimos e máximos de escolha.

- **[RF03] Controle de Endereços e Logística**
  O sistema deve gerenciar múltiplos endereços de clientes com alternância de prioridade e exigir um endereço único e exclusivo para cada restaurante.

- **[RF04] Integridade de Checkout e Pedidos**
  O sistema deve processar pedidos validando o status da loja e realizando o cálculo de valores e taxas integralmente no backend para garantir a segurança dos dados.

- **[RF05] Fluxo de Estados do Pedido**
  O sistema deve obrigar que os pedidos percorram uma sequência de estados unidirecional, avançando obrigatoriamente da criação até a entrega final.

- **[RF06] Avaliações e Feedback**
  O sistema deve permitir o envio de notas e resenhas apenas para pedidos com status finalizado, restringindo o feedback ao histórico real de consumo.

- **[RF07] Notificações e Mensageria**
  O sistema deve disparar alertas automáticos sobre mudanças de status logístico e fornecer rotas para o gerenciamento de leitura de notificações.

---

## Requisitos Não Funcionais

- **[RNF00] Usabilidade e Interface**
  O sistema deve apresentar uma interface intuitiva e responsiva, garantindo que o usuário consiga navegar entre categorias e finalizar pedidos com facilidade.

- **[RNF01] Segurança e Privacidade**
  O sistema deve proteger dados sensíveis através de criptografia de senhas (hash) e sanitização rigorosa de todos os dados recebidos via API.

- **[RNF02] Integridade e Precisão de Dados**
  O sistema deve garantir a precisão de cálculos financeiros no servidor e aplicar restrições de unicidade diretamente na camada de banco de dados para evitar duplicidade de registros.
