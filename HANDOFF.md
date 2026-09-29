# HANDOFF — Projeto Profissional (Template Mestre Canônico)

**Atualizado:** 2026-09-29 · **Branch:** `main` · **Status:** Pronto para Produção / Template Ativo

Documento executivo de transição entre sessões para agentes de código. Mantido enxuto para consumo mínimo de tokens.

---

## 🎯 Status Executivo (TL;DR)

- **Papel:** Repositório modelo canônico ("Golden Starter") para aplicações Express + Mongo + EJS.
- **Paridade:** 100% alinhado com a governança do `research` e diretrizes de design/segurança do ecossistema do Pedro.
- **Vitrine:** O TodoList implementado serve como demonstração de CRUD com Zod, papéis de usuário e suíte de testes.

---

## ✅ Concluído Recentemente

- Refatoração dos schemas Zod (`demo.schemas.js`) e model Mongoose (`project.model.js`) para atribuição automática de `responsavelId`.
- Resolução de isolamento de testes: 10 suítes e 77 testes Jest em memória passando com 100% de sucesso.
- Criação de `Makefile`, `Dockerfile` de dois estágios e `compose.dev.yml` com Nginx proxy reverso.
- Documentação mestre: `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `DESIGN.md`.

---

## 🔄 Em Andamento & Próximos Passos Imediatos

- [ ] Exportação/desmembramento da vitrine TodoList para repositório independente caso desejado.
- [ ] Implementação de gerador de scaffolds CLI (`npm run scaffold <model>`) para criar Rota + Controller + Service + Model em 1 comando.
- [ ] Ativação do repositório como template no GitHub (`gh repo edit --template=true`).

---

## ⚡ Comandos Rápidos de Retomada

```bash
cd app && npm test               # Roda os 77 testes em memória (~4s)
make dev                         # Sobe a stack de dev na porta 4429
curl -I http://localhost:4429/api/health
```
