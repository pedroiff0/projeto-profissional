# Arquitetura

## Visão geral

Monólito Express servindo API REST (`/api/*`) e páginas EJS (`/*`) do mesmo
processo. Persistência em MongoDB via Mongoose. Sem etapa de build no
front-end: as views são renderizadas no servidor e o JS é servido estático.

```
Navegador ──HTTP──► Express
                     ├── /api/*  → rateLimit → csrfGuard → rota → controller → service → model
                     └── /*      → pageAuth → view EJS
                                                       │
                                                   MongoDB
```

## Camadas

| Camada     | Responsabilidade                          | Não faz                     |
|------------|-------------------------------------------|-----------------------------|
| Route      | Mapear verbo+caminho, aplicar middlewares | Lógica, acesso a banco      |
| Controller | Traduzir HTTP ↔ domínio                   | Regra de negócio            |
| Service    | Regra de negócio, orquestração            | Conhecer `req`/`res`        |
| Model      | Formato e integridade do dado             | Regra de negócio            |

O service nunca recebe `req`. Recebe os dados já validados e o `userId`
explicitamente — isso mantém o escopo de ownership visível na assinatura.

## Cadeia de middlewares

Ordem em `app.js` (a ordem importa):

1. `helmet` — cabeçalhos de segurança e CSP.
2. `compression`.
3. `express.json` / `urlencoded` com limite de 100 kB.
4. `cookieParser`.
5. `sanitizeInput` — antes de qualquer rota tocar em `req.body`.
6. `express.static`.
7. CORS por allowlist (só em `/api`).
8. `apiLimiter` → `csrfGuard` → rotas de API.
9. Rotas de página.
10. `notFoundHandler` → `errorHandler` (sempre por último).

## Autenticação

Login valida credenciais no `authService`, emite JWT HS256 e o entrega de duas
formas: cookie `httpOnly` (navegador) e corpo da resposta (clientes Bearer).
A cada requisição, `middleware/auth.js` extrai o token, verifica assinatura,
carrega o usuário, confere `isActive` e compara `iat` com `tokenValidAfter`.

`tokenValidAfter` é o ponto de revogação: como o JWT é stateless, essa marca
no documento do usuário é o que permite derrubar todas as sessões de uma vez
(troca de senha, reset, desativação).

## Ciclo de vida da conta

```
admin cria conta ──► senha temporária (exibida 1x) + mustChangePassword=true
       │
       ▼
 primeiro login ──► redirecionado para /primeiro-acesso
       │
       ▼
 troca de senha ──► mustChangePassword=false, tokenValidAfter atualizado
       │
       ▼
    acesso normal ◄──► reset administrativo volta ao estado inicial
```

## Tratamento de erros

Erro esperado é `AppError(mensagem, status)`, lançado no service e propagado.
`errorHandler` é o único formatador: converte `ZodError` em 422, duplicata do
Mongo (código 11000) em 409, `AppError` no seu próprio status, e qualquer
outra coisa em 500 genérico — sem vazar stack. Responde JSON para `/api/*` e
renderiza `error.ejs` para páginas.

## Testes

Jest com `mongodb-memory-server`: cada suíte sobe um Mongo próprio em memória,
limpa as coleções entre testes e exercita o app real via Supertest. Sem mocks
de banco — o que é testado é o comportamento de ponta a ponta do HTTP.
