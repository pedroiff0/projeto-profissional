# CLAUDE.md

Contexto operacional para o Claude Code neste repositório.

> As regras de arquitetura, o que nunca fazer e o checklist de PR estão em
> **[AGENTS.md](AGENTS.md)**. Este arquivo cobre o que é específico da sessão
> de trabalho: comandos, armadilhas conhecidas e decisões já tomadas.

## O que é este repositório

Template base para começar um projeto web novo. Login + papéis (`admin`/`user`)
+ registro controlado por admin, com segurança endurecida por padrão. Não é
uma aplicação de domínio: é o esqueleto sobre o qual o domínio será escrito.

## Comandos

```bash
cd app
npm install
npm test                    # 20 testes, Mongo em memória
npm test -- auth.test.js    # um arquivo só
npm run dev                 # node --watch, porta 4447

docker compose up --build
docker compose logs -f app
docker compose exec mongo mongosh app_db
```

## Decisões já tomadas (não refazer sem motivo)

- **Sem autocadastro.** É a premissa do template, não um recurso faltando.
- **Sem bundler.** EJS + JS vanilla. Adicionar React/webpack descaracteriza.
- **CSP sem `unsafe-inline`.** Por isso não existe `<script>` inline em nenhuma
  view; o tema/scripts vão sempre para `public/js/`.
- **`upgradeInsecureRequests` desligado quando `COOKIE_SECURE=false`.** Em HTTP
  puro (LAN/Tailscale) ele faz o navegador tentar recarregar CSS/JS por HTTPS
  e a página aparece sem estilo nenhum.
- **Rate limiters e `csrfGuard` desligam em `NODE_ENV=test`.** Supertest não
  simula navegador e a suíte faria dezenas de logins.

## Armadilhas conhecidas

1. **`iat` do JWT é em segundos.** `tokenValidAfter` é `Date` (ms). A
   comparação em `middleware/auth.js` normaliza os dois para segundos. Comparar
   `iat * 1000 < tokenValidAfter` invalida token legítimo emitido no mesmo
   segundo — foi um bug real, pego pelos testes. Há teste cobrindo.
2. **Cookie `Secure` em HTTP.** O navegador descarta o cookie: login responde
   200 e a sessão não cola. Sintoma clássico de `COOKIE_SECURE=true` sem HTTPS.
3. **`passwordHash` tem `select:false`.** Query que precisa comparar senha tem
   que pedir `.select('+passwordHash')`, senão `bcrypt.compare` recebe
   `undefined`.
4. **Express 5 torna `req.query` um getter.** `sanitizeInput` muta o objeto no
   lugar em vez de reatribuir. Não "simplifique" para `req.query = {...}`.
5. **`npm ci` exige `package-lock.json`.** O CI usa `npm ci`; commite o lock.

## Modelo de dados

`User` e `AuditLog` — descritos em detalhe no README, seção Modelo de dados.
Campos de segurança (`tokenValidAfter`, `lockedUntil`,
`passwordResetTokenHash`) estão explicados em SECURITY.md.

## Ao adaptar para um projeto real

Ver README, seção "Adaptar para um projeto novo". Em resumo: renomear em
`package.json`/`.env.example`/`docker-compose.yml`, trocar a marca nas views,
e então acrescentar o domínio seguindo a cadeia model → service → controller
→ route → teste.
