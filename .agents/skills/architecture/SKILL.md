---
name: architecture
description: Diretrizes de arquitetura limpa em camadas para o template mestre canônico.
---

# Architecture Skill — Projeto Profissional

Instruções para implementação e manutenção da arquitetura em 4 camadas:

1. **Rotas (`src/routes/`):**
   - Declarativas. Aplicam middlewares de autenticação, rate-limit e validação Zod via `validate(schema)`.
   - Repassam diretamente para os métodos de controller.
2. **Controllers (`src/controllers/`):**
   - Recebem `req` e `res`.
   - Extraem parâmetros tipados, chamam services correspondentes e formatam resposta JSON ou renderizam template EJS.
   - Envolvidos pelo `asyncHandler` de `utils/validation.js`.
3. **Services (`src/services/`):**
   - Contêm a lógica de negócio pura, validações de domínio e orquestração de banco.
   - Lançam `AppError(msg, status)` quando alguma regra de negócio falhar.
4. **Models (`src/models/`):**
   - Schemas Mongoose contendo tipagem, índices para busca e hooks de auditoria.
