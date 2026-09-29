# Guia para Agentes — Projeto Profissional (Template Mestre Canônico)

Instruções para agentes de código (AGY, Claude Code, Copilot, Hermes) que operam neste repositório.
Leia atentamente antes de escrever qualquer linha de código.

---

## 🏛️ Contexto e Papel do Repositório

Este repositório é o **Template Mestre Canônico ("Golden Starter")** para desenvolvimento de aplicações web do Pedro.
Qualquer nova aplicação completa será criada a partir de um clone/template deste repositório (`gh repo create <novo-app> --template pedroiff0/projeto-profissional`).

> [!NOTE]
> A aplicação atualmente embarcada neste repositório (um TodoList profissional com projetos, tarefas, profissionais e catálogo) serve como **vitrine e prova de conceito arquitetural**. Em momento oportuno, ela será desacoplada para um repositório individual próprio, mantendo este repositório como o starter kit canônico.

---

## 🛠️ Stack Tecnológica

- **Linguagem / Runtime:** Node.js 22 LTS
- **Servidor Web:** Express 4
- **Interface / SSR:** EJS + JavaScript Vanilla (sem React, sem Babel, sem webpack, sem etapa de build)
- **Banco de Dados:** MongoDB 7 com Mongoose 8
- **Validação de Entrada:** Zod schemas obrigatórios
- **Segurança:** Helmet, Cookie-Parser (httpOnly), JWT, Rate-Limiting, CSP rigorosa
- **Testes:** Jest + Supertest + mongodb-memory-server (execução em memória, sem necessidade de banco ativo)
- **Containerização:** Docker Compose (`compose.dev.yml` e `compose.prod.yml`) + Nginx

---

## 📐 Arquitetura Estrita em 4 Camadas

```
app/
  src/
    config/       env.js (centralizador obrigatório), db.js
    models/       Mongoose schemas (User, Task, Project, Professional, etc.)
    services/     Regra de negócio pura e manipulação de domínio
    controllers/  Tradução HTTP: req -> service -> res
    routes/       Definição de endpoints e aplicação de validação Zod
    middleware/   auth, errorHandler, validation, rateLimiters, pageAuth
    schemas/      Zod schemas para POST/PUT/PATCH
    utils/        AppError, secrets, validation
  views/          partials/{header,footer,sidebar,topnav} + pages/*.ejs
  public/         css/{main,landing}.css, js/ (um JS por tela), vendor/
  tests/          Suíte Jest completa em memória
nginx/            Configurações de proxy reverso
scripts/          Scripts operacionais (setup-secrets.sh, backup.sh, deploy.sh)
```

---

## ⚖️ Regras Arquiteturais Inegociáveis

1. **Camadas Estritas:**
   - Rota $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Model.
   - Nenhuma regra de negócio deve residir em controllers ou rotas.
2. **Zod Obrigatório:**
   - Todo endpoint de mutação (`POST`, `PUT`, `PATCH`) deve validar a entrada via middleware `validate(schema)`. Nunca acesse `req.body` bruto.
3. **Tratamento Centralizado de Erros:**
   - Use `AppError(mensagem, status)` — nunca dispare `throw new Error()` genérico. O `errorHandler` é o único responsável por formatar saídas de erro.
4. **CSP sem `unsafe-inline`:**
   - Zero `<script>` inline, zero tags `<style>`, zero atributos `onclick=`.
   - Scripts vivem em arquivos servidos de `/js/`.
5. **Escape de Dados User-Facing:**
   - Toda saída de texto em templates EJS deve utilizar `<%= %>` ou passar por sanitização antes de renderizar HTML.
6. **Zero Emojis na Interface:**
   - Ícones visuais devem ser estritamente SVG inline com `stroke="currentColor"`, `width="16..20"`, `height="16..20"`, mantendo visual executivo e corporativo.
7. **Separação Código vs. Documentação:**
   - Código, testes e configs vivem neste repositório.
   - Documentação conceitual, notas de estudo e planejamento do projeto vivem no cofre Obsidian em `hardcore-life/01-projetos/profissional/projeto-profissional/`.
8. **Segredos e Variáveis:**
   - Nunca comite `.env`. Em produção, segredos são montados via Docker secrets ou lidos de `/run/secrets/`.
9. **Testes Obrigatórios:**
   - Toda funcionalidade ou endpoint novo deve acompanhar teste correspondente em `app/tests/`. A suíte roda via Jest em memória (`npm test`).

---

## 💻 Comandos Padronizados (`Makefile`)

```bash
make dev           # Sobe stack de desenvolvimento com live-reload (porta 4429)
make down          # Para containers de desenvolvimento
make test          # Executa suíte completa de testes Jest em memória
make lint          # Linter e verificação sintática
make prod          # Deploy de produção (porta 4430) e demo (porta 4431)
make health        # Verifica status HTTP de todas as portas
make clean         # Limpa containers e volumes órfãos
```
