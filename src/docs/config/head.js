// src/docs/config/head.js

// Função para obter os servidores na ordem correta (dev/prod)
const getServersInCorrectOrder = () => {
    const prodUrl = {
        url: process.env.SWAGGER_PROD_URL || `http://localhost:5020/pedidos`
    };
    const devUrl = {
        url: process.env.SWAGGER_DEV_URL || "http://localhost:5020"
    };

    if (process.env.NODE_ENV === "development") return [devUrl, prodUrl];
    else return [prodUrl, devUrl];
};

const getSwaggerOptions = async () => {
    const t = process.env.NODE_ENV === 'development' ? `?t=${Date.now()}` : '';

    // Paths
    const authPaths = (await import(new URL("../paths/auth.js",
        import.meta.url).href + t)).default;
    const usuarioPaths = (await import(new URL("../paths/usuario.js",
        import.meta.url).href + t)).default;
    const categoriaPaths = (await import(new URL("../paths/categoria.js",
        import.meta.url).href + t)).default;
    const restaurantePaths = (await import(new URL("../paths/restaurante.js",
        import.meta.url).href + t)).default;
    const enderecoPaths = (await import(new URL("../paths/endereco.js",
        import.meta.url).href + t)).default;
    const pratoPaths = (await import(new URL("../paths/prato.js",
        import.meta.url).href + t)).default;
    const adicionalGrupoPaths = (await import(new URL("../paths/adicionalGrupo.js",
        import.meta.url).href + t)).default;
    const adicionalOpcaoPaths = (await import(new URL("../paths/adicionalOpcao.js",
        import.meta.url).href + t)).default;
    const pedidoPaths = (await import(new URL("../paths/pedido.js",
        import.meta.url).href + t)).default;
    const avaliacaoPaths = (await import(new URL("../paths/avaliacao.js",
        import.meta.url).href + t)).default;
    const notificacaoPaths = (await import(new URL("../paths/notificacao.js",
        import.meta.url).href + t)).default;

    // Schemas
    const authSchemas = (await import(new URL("../schemas/authSchema.js",
        import.meta.url).href + t)).default;
    const usuarioSchemas = (await import(new URL("../schemas/usuarioSchema.js",
        import.meta.url).href + t)).default;
    const categoriaSchemas = (await import(new URL("../schemas/categoriaSchema.js",
        import.meta.url).href + t)).default;
    const restauranteSchemas = (await import(new URL("../schemas/restauranteSchema.js",
        import.meta.url).href + t)).default;
    const enderecoSchemas = (await import(new URL("../schemas/enderecoSchema.js",
        import.meta.url).href + t)).default;
    const pratoSchemas = (await import(new URL("../schemas/pratoSchema.js",
        import.meta.url).href + t)).default;
    const adicionalGrupoSchemas = (await import(new URL("../schemas/adicionalGrupoSchema.js",
        import.meta.url).href + t)).default;
    const adicionalOpcaoSchemas = (await import(new URL("../schemas/adicionalOpcaoSchema.js",
        import.meta.url).href + t)).default;
    const pedidoSchemas = (await import(new URL("../schemas/pedidoSchema.js",
        import.meta.url).href + t)).default;
    const avaliacaoSchemas = (await import(new URL("../schemas/avaliacaoSchema.js",
        import.meta.url).href + t)).default;
    const notificacaoSchemas = (await import(new URL("../schemas/notificacaoSchema.js",
        import.meta.url).href + t)).default;

    return {
        swaggerDefinition: {
            openapi: "3.0.0",
            info: {
                title: "Rango API",
                version: "1.1.0",
                description: `
### 📋 Visão Geral
Documentação oficial da Rango API - O sistema central de gerenciamento e visualização de rotas do APP de delivery.
Esta API é responsável por orquestrar perfeitamente nossa infraestrutura web(futura) e aplicativo móvel, desde a moderação de restaurantes e cardápios avançados até o envio de notificações de status do pedido para os usuários.

---

### 🚀 Principais Features
*   **Autenticação JWT Segura:** Sistema robusto com tokens de recuperação e \`refresh_tokens\`.
*   **Gestão de Restaurantes e Cardápios:** Gerencie restaurantes, pratos agrupados, grupos de adicionais e variações.
*   **Integração Coud-Native (S3):** Gerenciamento inteligente de fotos (upload multipart/form-data) persistidas no Garage/MinIO.
*   **Processamento de Pedidos:** Acompanhamento de carrinho com subcálculos, taxas de entrega com pipeline de status (criado → em preparo → saiu para entrega → entregue).
*   **Push & Notificações:** Sistema assíncrono interno de notificações do usuário.

---

### 🔐 Segurança
Todo fluxo seguro exige injeção do JWT no cabeçalho através do botão **Authorize** ao topo.

*Utilize as credenciais de admin ou dono de restaurante para acessar algumas das rotas fechadas.*
                `,
                contact: {
                    name: "Suporte Rango App",
                    email: "suporte@rango.web.fslab.dev",
                },
            },
            servers: getServersInCorrectOrder(),
            tags: [
                {
                    name: "Auth",
                    description: "Rotas para autenticação e autorização"
                },
                {
                    name: "Usuários",
                    description: "Rotas para o gerenciamento de usuários"
                },
                {
                    name: "Categorias",
                    description: "Rotas para o gerenciamento de categorias de restaurantes"
                },
                {
                    name: "Restaurantes",
                    description: "Rotas para o gerenciamento de restaurantes"
                },
                {
                    name: "Endereços",
                    description: "Rotas para o gerenciamento de endereços de usuários e restaurantes"
                },
                {
                    name: "Pratos",
                    description: "Rotas para o gerenciamento de pratos e cardápio"
                },
                {
                    name: "Adicionais - Grupos",
                    description: "Rotas para gestão de grupos de adicionais"
                },
                {
                    name: "Adicionais - Opções",
                    description: "Rotas para gestão de opções de adicionais"
                },
                {
                    name: "Pedidos",
                    description: "Rotas para o gerenciamento de pedidos de delivery"
                },
                {
                    name: "Avaliações",
                    description: "Rotas para avaliações de restaurantes"
                },
                {
                    name: "Notificações",
                    description: "Rotas para notificações do sistema"
                }
            ],
            paths: {
                ...authPaths,
                ...usuarioPaths,
                ...categoriaPaths,
                ...restaurantePaths,
                ...enderecoPaths,
                ...pratoPaths,
                ...adicionalGrupoPaths,
                ...adicionalOpcaoPaths,
                ...pedidoPaths,
                ...avaliacaoPaths,
                ...notificacaoPaths,
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    }
                },
                schemas: {
                    ...authSchemas,
                    ...usuarioSchemas,
                    ...categoriaSchemas,
                    ...restauranteSchemas,
                    ...enderecoSchemas,
                    ...pratoSchemas,
                    ...adicionalGrupoSchemas,
                    ...adicionalOpcaoSchemas,
                    ...pedidoSchemas,
                    ...avaliacaoSchemas,
                    ...notificacaoSchemas
                }
            },
            security: [{
                bearerAuth: []
            }]
        },
        apis: ["./src/routes/*.js"]
    };
};

export default getSwaggerOptions;
