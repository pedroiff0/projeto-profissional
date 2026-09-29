---
name: testing
description: Diretrizes de testes unitários e de integração em memória com Jest e Supertest.
---

# Testing Skill — Projeto Profissional

Instruções para execução e criação de testes:

1. **Ambiente Isolado em Memória:**
   - Todos os testes utilizam `mongodb-memory-server` configurado via `tests/helpers/db.js`.
   - Nenhum container ou banco de dados externo precisa estar rodando.
2. **Execução:**
   - `npm test` na pasta `app/` roda toda a suíte com `--runInBand --forceExit`.
3. **Padrão de Teste:**
   - Sempre use `beforeAll(setupDb)`, `afterAll(teardownDb)` e `afterEach(clearDb)`.
   - Teste rotas autenticadas gerando token JWT via `authService.generateToken(user)`.
