<p align="center">
  <img src="https://img.shields.io/badge/System-Requirements-02303A?style=for-the-badge&logo=notion&logoColor=white" alt="Requisitos"/>
  <img src="https://img.shields.io/badge/Status-Aprovado-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Status"/>
</p>

# 📋 Especificação Funcional e Tecnológica

Este documento consolida os **Requisitos Funcionais (RF)** e **Requisitos Não Funcionais (RNF)** da API de Delivery, levantados com base na arquitetura e modelagem mental feita por nós no notion.

---

## 🎯 Requisitos Funcionais (RF)
Os Requisitos Funcionais descrevem **o que o sistema deve fazer**, englobando as regras de negócio intrínsecas a cada módulo e as ações permitidas aos usuários (Roles).

### 🔐 1. Autenticação e Perfis (Roles)
| ID | Descrição do Requisito | Atores Envolvidos | Prioridade |
|:---:|---|:---:|:---:|
| **RF-01** | O sistema deve permitir o cadastro de novos usuários via e-mail e senha. | *Público* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-02** | O sistema deve autenticar usuários e gerar um Token JWT (`Bearer`) para gestão da sessão. | *Usuário* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-03** | O sistema deve permitir a renovação da sessão via `Refresh Token` para não deslogar o usuário em uso constante. | *Usuário logado* | ![Média](https://img.shields.io/badge/Média-yellow?style=flat-square) |
| **RF-04** | O sistema deve oferecer mecanismo de recuperação de senha com link assinado e limitação de tentativas (Rate Limit). | *Público* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-05** | O sistema deve inativar imediatamente a sessão e impedir novas ações de usuários com a conta deletada ou bloqueada por admin. | *Admin* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |

### 🏪 2. Gestão de Entidades (Restaurantes e Categorias)
| ID | Descrição do Requisito | Atores Envolvidos | Prioridade |
|:---:|---|:---:|:---:|
| **RF-06** | O sistema deve permitir que Proprietários/Admins cadastrem restaurantes com CNPJ único (14 dígitos validáveis). | *Dono / Admin* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-07** | O restaurante deve pertencer a uma ou mais **Categorias globais** pré-definidas por Administradores. | *Dono* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-08** | O proprietário deve conseguir alterar livremente o status operacional do restaurante (`Aberto` ou `Fechado`). | *Dono* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |

### 🍔 3. Gestão de Cardápio (Pratos e Adicionais Customizáveis)
| ID | Descrição do Requisito | Atores Envolvidos | Prioridade |
|:---:|---|:---:|:---:|
| **RF-09** | O sistema deve permitir o cadastro de pratos atrelados ao restaurante, separados por seções da loja. | *Dono* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-10** | O sistema deve fornecer mecanismos de **Grupos de Adicionais** ("Escolha seu Ponto" etc.), estabelecendo limitadores de *Minimo* e *Máximo*. | *Dono* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-11** | O sistema deve aceitar **Opções de Adicionais** dentro de seus referidos grupos, contendo incremento no valor base ou gratuito. | *Dono* | ![Média](https://img.shields.io/badge/Média-yellow?style=flat-square) |
| **RF-12** | O sistema deve permitir o *Upload* e *Exclusão* de fotos customizadas dos pratos no Cardápio. | *Dono* | ![Baixa](https://img.shields.io/badge/Baixa-brightgreen?style=flat-square) |

### 📍 4. Logística e Endereços
| ID | Descrição do Requisito | Atores Envolvidos | Prioridade |
|:---:|---|:---:|:---:|
| **RF-13** | O sistema deve suportar que Usuários Clientes cadastrem *N* endereços e elejam apenas *um* como seu "Endereço Principal". | *Cliente* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-14** | Ao trocar o endereço principal, o backend obrigatoriamente deve retirar tal propriedade em cascata de todos os outros. | *Sistema* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-15** | Todo Restaurante poderá possuir estritamente apenas **1 (um)** endereço atrelado e exclusivo para ser listado. | *Dono* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |

### 🚚 5. Negociação Término e Pedidos
| ID | Descrição do Requisito | Atores Envolvidos | Prioridade |
|:---:|---|:---:|:---:|
| **RF-16** | O sistema deve impedir a criação de pedidos para lojas que constem com o status operacional em estado `Fechado` ou `Inativo`. | *Cliente / Sistema* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-17** | O sistema deve ignorar qualquer preço injetado pelo Front-End através do Body JSON e **obter os valores originais em banco para realizar os cálculos matemáticos confiáveis** da Cesta. | *Sistema* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |
| **RF-18** | Os fluxos do Pedido processado devem percorrer etapas unidirecionais inquebrantáveis (`Criado` → `Em Preparo` → `A Caminho` → `Entregue`). | *Dono / Sistema* | ![Alta](https://img.shields.io/badge/Alta-red?style=flat-square) |

### ⭐ 6. Hub Social (Avaliações e Notificações)
| ID | Descrição do Requisito | Atores Envolvidos | Prioridade |
|:---:|---|:---:|:---:|
| **RF-19** | Apenas clientes que tiverem com seus **pedidos finalizados** podem enviar nota (1 a 5) e resenha opinativa pro Cátalogo do restaurante. | *Cliente* | ![Média](https://img.shields.io/badge/Média-yellow?style=flat-square) |
| **RF-20** | O software emitirá gatilhos (Triggers/Notificações) para alertar Mudanças de Status logísticos. | *Sistema* | ![Baixa](https://img.shields.io/badge/Baixa-brightgreen?style=flat-square) |
| **RF-21** | O usuário deve dispor de uma rota para varrer notificações não-lidas e mudá-las para `lida=true`. | *Cliente / Dono* | ![Baixa](https://img.shields.io/badge/Baixa-brightgreen?style=flat-square) |

---

## ⚙️ Requisitos Não Funcionais (RNF)

Os Requisitos Não Funcionais descrevem **os aspectos qualitativos** da plataforma, como performance, limites operacionais, arquitetura e padronização.

### 🛡️ 1. Segurança e Privacidade
- **[RNF-01]** As senhas dos usuários submetidas pelo payload devem sofrer imediatamente sanitização e Hash irreversible (por ex: *bcrypt*) antes de salvar nos Data Lakes documentais (MongoDB).
- **[RNF-02]** A API nunca pode injetar campos críticos diretos (Ex. `isAdmin`) sem antes filtrá-los em um mapper de sanitização para evitar sequestro de conta ou bypasses no sistema.
- **[RNF-03]** Rate Limiting baseados em roteamento IP `X-Forwarded-For` de 50 ações a cada 5 Minutos em endpoints críticos de Auth, para conter massivas repetições de _Brute Force/Dictionary_.

### 🚀 2. Arquitetura e Engenharia de Software
- **[RNF-04] Tecnologias Principais:** O Web Server rodará no ecosistema **Node.js** usando a engine **Express.js**. O Banco de Dados obrigatoriamente seguirá modelo Non-SQL (Schemaless / **MongoDB**).
- **[RNF-05] RESTful API:** Toda transferência comunicacional seguirá princípios nativos de REST. Respostas em notação padronizada `JSON`. Endpoints organizados semanticamente. (Exemplo: pluralização).
- **[RNF-06] Padrão Containerização (Docker):** O servidor, dependências locais e banco deverão ser englobados via `docker-compose.yml` para facilitar replicação do ambiente entre o Time Dev.

### 📈 3. Dados, Precisão e Consistência (Database)
- **[RNF-07] Preços Dinâmicos**: A aplicação terá tolerância e arredondamento cirúrgico de Casas Formais para dinheiro via rotina interna de `Math.round(val*100) / 100`.
- **[RNF-08] Integridade de Chaves**: A impossibilidade visual do Restaurante ter mais de uma Cede Operacional será bloqueada via diretrizes de Index Nativo (`Unique Constraint`) diretamente da Storage do MongoDB, e não apenas no serviço em Express.
- **[RNF-09] Soft-Delete Policies:** Como regra de negócio, nenhum usuário ou restaurante deve ser excluído fatalmente (Delete cascade relacional). Ao inativar, a flag `status: inativo` impedirá tráfego, enquanto dados analíticos seguem guardados no servidor isolado.

---
> 💡 *Nota*: A base destes domínios arquitetônicos interliga-se com a estrutura expressada na aba do Notion em desenvolvimento contínuo da equipe. Quaisquer refatorações nos comportamentos base precisarão cruzar pela readequação desde Markdown local.
