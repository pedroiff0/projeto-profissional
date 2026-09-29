---
name: code-review
description: Checklist rigoroso de revisão de código, CSP, escape de dados e design tokens.
---

# Code Review Skill — Projeto Profissional

Checklist que todo agente ou revisor deve validar antes de submeter commits:

1. **Segurança & CSP:**
   - [ ] Sem tags `<script>` ou `<style>` inline.
   - [ ] Sem atributos `onclick=`, `onload=`, etc.
   - [ ] Sem bibliotecas externas de CDN (tudo vendorizado localmente em `app/public/vendor/`).
2. **Sanitização:**
   - [ ] Todas as entradas de mutação passam por schema Zod.
   - [ ] Todas as saídas de texto em views utilizam `<%= %>` ou `escapeHtml()`.
3. **Design Tokens & SVG:**
   - [ ] Sem cores hardcoded (use `var(--token)` definido em `main.css`).
   - [ ] Sem emojis na UI (use SVG inline `stroke="currentColor"`).
4. **Testes:**
   - [ ] `npm test` verde com 100% dos testes passando.
