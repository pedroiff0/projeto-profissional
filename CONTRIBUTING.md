# Contribuindo

## Ambiente

```bash
cp .env.example .env          # gere JWT_SECRET: openssl rand -base64 48
cd app && npm install && npm test
npm run dev                   # http://localhost:4450
```

## Fluxo

1. Branch a partir de `main`: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
2. Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: adiciona listagem de pedidos`, `fix: corrige comparacao de iat`.
3. `npm test` verde antes de abrir o PR.
4. Abra o PR descrevendo **o quê** e **por quê**; o CI roda testes e
   `npm audit --audit-level=high`.

## Padrões de código

- Camadas: Rota → Controller → Service → Model (ver AGENTS.md).
- Zod em toda entrada; `AppError` em todo erro esperado.
- 2 espaços de indentação, aspas simples, ponto e vírgula (ver `.editorconfig`).
- Comentário explica **por quê**, não o quê. Comentário que só reescreve o
  código em português é ruído.
- Nome de variável e mensagem de usuário em português; nome de arquivo,
  função e campo de banco em inglês (ou consistente com o que já existe).

## Testes

Todo endpoint novo precisa de teste em `app/tests/` cobrindo: caminho feliz,
entrada inválida (422), sem autenticação (401) e sem permissão (403).

## Segurança

Não abra issue pública para vulnerabilidade — siga [SECURITY.md](SECURITY.md).
