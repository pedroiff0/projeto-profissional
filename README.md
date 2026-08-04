# Projeto Profissional — Template Base

Template minimalista e endurecido para iniciar um repositório novo: autenticação
com JWT, dois papéis (`admin` / `user`), **registro controlado por administrador**
(sem autocadastro) e as proteções de segurança já ligadas por padrão.

Serve como *first commit* de qualquer projeto web Node: clone, renomeie, comece
a adicionar o domínio.

## Stack

| Camada    | Tecnologia                          |
|-----------|-------------------------------------|
| Backend   | Node.js 20 + Express                |
| Banco     | MongoDB + Mongoose                  |
| Frontend  | EJS (SSR) + JS vanilla, sem build    |
| Auth      | JWT HS256 — cookie httpOnly ou Bearer |
| Validação | Zod                                 |
| Testes    | Jest + Supertest + mongodb-memory-server |
| Deploy    | Docker Compose (app não-root, read-only) |

## Início rápido

```bash
git clone <seu-repo> && cd <seu-repo>
cp .env.example .env
# gere um secret:  openssl rand -base64 48   -> cole em JWT_SECRET

cd app && npm install
npm test          # 20 testes
npm run dev       # http://localhost:4447
```

No primeiro boot, se não houver nenhum admin no banco, o sistema cria um e
imprime a senha **uma única vez** no log. Guarde-a naquele momento.

Com Docker:

```bash
JWT_SECRET=$(openssl rand -base64 48) docker compose up --build
```

## Estrutura

```
app/src/
  config/      env.js (validação de ambiente), db.js
  models/      Mongoose schemas (user, auditLog)
  services/    regra de negócio (authService, userService)
  controllers/ handlers de rota (req -> service -> res)
  routes/      mapeamento de endpoints
  middleware/  auth, pageAuth, requireRole, csrfGuard, sanitizeInput,
               rateLimiters, errorHandler
  schemas/     validação Zod
  seeds/       admin.seed.js
  utils/       AppError, validation, audit
app/views/     EJS
app/public/    css/ e js/ (sem bundler)
app/tests/     Jest + Supertest
```

Fluxo obrigatório: **Rota → Controller → Service → Model**. A regra de negócio
mora no service; o controller só traduz HTTP.

## Endpoints

| Método | Rota                                  | Acesso  |
|--------|---------------------------------------|---------|
| POST   | `/api/auth/login`                     | público (rate-limited) |
| POST   | `/api/auth/logout`                    | público |
| GET    | `/api/auth/me`                        | autenticado |
| PATCH  | `/api/auth/me`                        | autenticado |
| POST   | `/api/auth/change-password`           | autenticado |
| POST   | `/api/auth/forgot-password`           | público (rate-limited) |
| POST   | `/api/auth/reset-password`            | público (rate-limited) |
| GET    | `/api/admin/users`                    | admin   |
| POST   | `/api/admin/users`                    | admin   |
| PATCH  | `/api/admin/users/:id`                | admin   |
| POST   | `/api/admin/users/:id/reset-password` | admin   |
| GET    | `/api/health/{live,ready}`            | público |

Páginas: `/`, `/login`, `/forgot-password`, `/reset-password`,
`/primeiro-acesso`, `/app`, `/perfil`, `/admin`.

## Modelo de dados

**User** — `role` (`admin`|`user`), `name`, `email` (único, lowercase),
`passwordHash` (bcrypt cost 12, `select:false`), `isActive`,
`mustChangePassword`, `tokenValidAfter` (invalidação global de sessão),
`failedLoginAttempts` + `lockedUntil` (lockout), `passwordResetTokenHash` +
`passwordResetExpires` (TTL index), `lastLoginAt`, timestamps.

**AuditLog** — `action` (enum fechado), `actorId`, `targetId`, `ip`,
`userAgent`, `meta`, `createdAt` com TTL de 180 dias. Nunca guarda senha,
token ou hash.

## Segurança embutida

- Bcrypt cost 12; hash nunca sai em nenhuma resposta (`select:false`).
- Senha mínima: 12 caracteres com maiúscula, minúscula e dígito.
- Lockout: 3 tentativas → 30 min de bloqueio.
- Comparação em tempo constante contra hash dummy quando o e-mail não existe
  (anti-enumeração por timing); `/forgot-password` responde igual sempre.
- Cookie `httpOnly` + `SameSite=Lax` + `Secure` automático em HTTPS.
- `csrfGuard`: valida Origin/Referer em mutações autenticadas por cookie.
- `sanitizeInput`: remove chaves `$`/`.` (injeção NoSQL), corta profundidade.
- Helmet com CSP restritiva — **sem `unsafe-inline`**: todo JS fica em arquivo.
- Rate limit: 300 req/5 min na API, 3 tentativas/30 min em login/reset.
- CORS por allowlist explícita, nunca `*`.
- Corpo limitado a 100 kB; `x-powered-by` desligado.
- `tokenValidAfter` derruba todas as sessões ao trocar senha ou desativar conta.
- Erro 500 nunca vaza stack nem mensagem crua.
- Container: usuário não-root, `read_only`, `no-new-privileges`, healthcheck.

Detalhes e processo de reporte: [SECURITY.md](SECURITY.md).

## Testes

Suíte com **20 testes** (Jest + Supertest) contra um MongoDB real em memória —
sem mock de banco.

```bash
cd app
npm test                      # suíte completa (~10 s)
npm run test:watch            # re-executa ao salvar
npm test -- auth.test.js      # um arquivo
npm run test:coverage         # cobertura
```

Documentação completa: [docs/testing.md](docs/testing.md).

## Teste de carga

Stack de teste isolada (banco próprio, descartável) e cenário k6 dockerizado.

```bash
docker compose -f docker-compose.test.yml -p pp-test up -d --build
docker compose -f docker-compose.test.yml -p pp-test exec -T app-test node scripts/seed-carga.js 50
docker compose -f docker-compose.test.yml -p pp-test --profile carga \
  run --rm -e PERFIL=carga -e CARGA_VUS=100 k6 run /scripts/carga.js
```

Resultados medidos em Intel i5-9400F (6 núcleos), 1 instância:

| Carga | Erros | Vazão | Leitura p95 | Situação |
|---|---|---|---|---|
| 100 VUs | 0,00% | 214 req/s | 287 ms | Todos os limiares aprovados |
| 200 VUs | 0,00% | 262 req/s | 989 ms | Sem erros, latência acima da meta |

O gargalo é o login (bcrypt custo 12, limitado por CPU): ~4,5 logins/s por
instância. A aplicação é *stateless*, então escala horizontalmente.

Metodologia, perfis (`smoke`, `carga`, `estresse`, `pico`, `auth`) e análise:
[docs/load-testing.md](docs/load-testing.md).

## Ambientes

| | Produção | Teste / carga |
|---|---|---|
| Arquivo | `docker-compose.yml` | `docker-compose.test.yml` |
| Projeto | `pp` | `pp-test` |
| Banco | `app_db`, volume persistente | `app_test_db`, `tmpfs` descartável |
| Porta | `127.0.0.1:4447` | `127.0.0.1:4446` |
| Limitação de taxa | Ativa | Desativada |

As duas podem rodar ao mesmo tempo, em redes Docker separadas.

## Documentação

- [docs/architecture.md](docs/architecture.md) — camadas e fluxo de requisição
- [docs/testing.md](docs/testing.md) — suíte npm, como escrever testes
- [docs/load-testing.md](docs/load-testing.md) — capacidade medida
- [docs/deployment.md](docs/deployment.md) — deploy, proxy reverso, backup
- [SECURITY.md](SECURITY.md) — arquitetura de segurança
- [AGENTS.md](AGENTS.md) — instruções para agentes de código

## Adaptar para um projeto novo

1. `app/package.json`: `name` e `description`.
2. `.env.example` / `docker-compose.yml`: nome do banco e `APP_NAME`.
3. Views: marca em `views/partials/header.ejs` e `views/landing.ejs`.
4. Papéis: ajuste o enum em `models/user.model.js` e `schemas/admin.schemas.js`.
5. Domínio: novo model → service → controller → routes, registrado em
   `routes/index.js`. Teste em `tests/`.

## Licença

MIT — veja [LICENSE](LICENSE).
