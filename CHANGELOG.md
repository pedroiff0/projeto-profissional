# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Mapeamento de respostas HTTP: página `/status` (tabela filtrável por `?q=`),
  API `GET /api/status/:code` (JSON estruturado, 404 se não mapeado) e página
  de erro rericada (código grande, título amigável, ação de recuperação, botão
  Voltar e detalhes de validação). Catálogo centralizado em `HTTP_CATALOG`/
  `ERROR_CATALOG`; suíte sobe de 20 para 44 testes.
- Dois bancos sempre isolados (teste `app_test_db` / produção `app_db`): o de
  teste nasce populado com `admin@admin.com` + usuários demo; a produção sobe só
  com o admin e é preenchida via interface. Senha do admin lida de
  `SEED_PASSWORD_FILE` (`~/Documentos/comum/senhas-projetos.md`, não versionado,
  compartilhado entre projetos). Suíte sobe de 44 para 50 testes.
- `DESIGN.md`: sistema visual em tokens no formato DESIGN.md (Google), com
  exports `tailwind.theme.json` e `tokens.json`. Lint oficial sem erros nem
  avisos; contrastes de texto verificados contra WCAG AA.

## [0.1.0]

### Adicionado

- Autenticação JWT HS256 via cookie `httpOnly` ou header `Bearer`.
- Papéis `admin` e `user` com guards de API (`requireRole`) e de página
  (`requirePageRole`).
- Registro controlado por administrador: `POST /api/admin/users` gera senha
  temporária exibida uma única vez; conta nasce com `mustChangePassword`.
- Fluxos de troca de senha, esquecimento e redefinição por token com hash
  SHA-256 e expiração via TTL index.
- Lockout de conta (3 tentativas / 30 min) e rate limit por IP.
- `AuditLog` com retenção de 180 dias para eventos sensíveis.
- Endurecimento: Helmet com CSP sem `unsafe-inline`, `csrfGuard`,
  `sanitizeInput` (anti-injeção NoSQL), CORS por allowlist, limite de corpo.
- Views EJS (landing, login, recuperação, primeiro acesso, painel, perfil,
  administração de usuários) sem etapa de build.
- Suíte Jest + Supertest com Mongo em memória (20 testes).
- Docker Compose com app não-root, `read_only` e healthcheck; CI no GitHub
  Actions rodando testes e `npm audit`.

### Segurança

- Corrigida a comparação de `iat` (segundos) com `tokenValidAfter`
  (milissegundos), que invalidava tokens legítimos emitidos no mesmo segundo.
