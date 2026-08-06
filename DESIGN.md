---
version: alpha
name: Projeto Profissional
description: Clareza institucional sem ornamento — uma base sóbria que transmite segurança e permanência.
colors:
  primary: "#2563eb"
  secondary: "#0b5f9e"
  tertiary: "#0f172a"
  neutral: "#f6f8fb"
  surface: "#ffffff"
  text: "#0f172a"
  muted: "#475569"
  subtle: "#64748b"
  border: "#e2e8f0"
  error: "#b42318"
  success: "#067647"
  footer-bg: "#0f172a"
  footer-text: "#b6c2d1"
typography:
  h1:
    fontFamily: system-ui
    fontSize: 3.1rem
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  h2:
    fontFamily: system-ui
    fontSize: 2.1rem
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h3:
    fontFamily: system-ui
    fontSize: 1.15rem
    fontWeight: 700
    lineHeight: 1.3
  lead:
    fontFamily: system-ui
    fontSize: 1.15rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: system-ui
    fontSize: 0.9rem
    fontWeight: 400
    lineHeight: 1.5
  eyebrow:
    fontFamily: system-ui
    fontSize: 0.8rem
    fontWeight: 700
    letterSpacing: "0.08em"
  stat:
    fontFamily: system-ui
    fontSize: 2.3rem
    fontWeight: 800
    lineHeight: 1.1
rounded:
  sm: 9px
  md: 10px
  lg: 16px
  xl: 18px
  pill: 999px
  section: 26px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  section: 72px
elevation:
  card: 0 10px 30px rgba(15, 23, 42, 0.07)
  card-hover: 0 18px 44px rgba(15, 23, 42, 0.12)
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "#1d4ed8"
    textColor: "#ffffff"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 12px
  button-outline-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.text}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 27px
  card-meta:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.subtle}"
  section-lead:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  alert-success:
    backgroundColor: "#e6f6ee"
    textColor: "{colors.success}"
    rounded: "{rounded.md}"
  alert-error:
    backgroundColor: "#fdeceb"
    textColor: "{colors.error}"
    rounded: "{rounded.md}"
  badge:
    backgroundColor: "#eaf1fe"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 5px
  step-marker:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: 46px
    width: 46px
  footer:
    backgroundColor: "{colors.footer-bg}"
    textColor: "{colors.footer-text}"
    padding: 48px
---

## Overview

Clareza institucional sem ornamento.

Este é o sistema visual de uma **base técnica**, não de um produto de consumo.
Quem chega aqui está avaliando se pode confiar a fundação de um projeto ao
código — então a interface tem uma única tarefa: parecer sólida, previsível e
honesta. Nada pisca, nada desliza sozinho, nada tenta impressionar.

Três decisões guiam tudo:

1. **Sobriedade sobre personalidade.** A paleta é essencialmente azul e cinza
   sobre branco. Um projeto derivado troca o azul pela cor da sua marca e todo
   o resto continua funcionando.
2. **Densidade honesta.** Espaço em branco generoso entre seções, conteúdo
   compacto dentro dos cartões. O olho descansa entre blocos e trabalha dentro
   deles.
3. **Bootstrap 5 empacotado localmente.** O framework CSS vive em
   `public/vendor/bootstrap` (sem CDN, respeita a CSP `self`). A identidade
   própria fica em `public/css/main.css`, que sobrepõe as variáveis do
   Bootstrap via `:root` (cor primária, raio, sombra). A página renderiza
   offline, sem etapa de build.

## Colors

O azul é o **único** condutor de interação. Se algo é azul, é clicável, é um
número de destaque ou é uma marca de seção. Essa regra sozinha elimina a
necessidade de sublinhado, seta ou instrução.

- **Primary (`#2563eb`)** — ações, links, ícones, números de destaque e a
  marca `PP`. É o ponto de troca em um projeto derivado: mude aqui e a
  identidade inteira acompanha.
- **Secondary (`#0b5f9e`)** — usado **apenas** como segundo ponto do gradiente
  da faixa de chamada. Nunca em texto ou borda.
- **Tertiary (`#0f172a`)** — o azul-tinta dos títulos e do rodapé. É o que dá
  peso editorial sem recorrer ao preto puro, que sobre branco vibra.
- **Neutral (`#f6f8fb`)** — fundo da página. Levemente frio, para que os
  cartões brancos tenham relevo sem precisar de sombra pesada.
- **Muted (`#475569`)** e **Subtle (`#64748b`)** — texto secundário sobre
  fundo claro. Medidos contra branco: 7.5:1 e 4.76:1, ambos aprovados em
  WCAG AA.
- **`#94a3b8` só existe sobre o rodapé escuro** (6.96:1, aprovado). Sobre
  branco ele rende apenas **2.56:1** e reprova em AA — por isso todo uso em
  fundo claro foi substituído por `subtle`. Ao introduzir um cinza novo,
  meça antes: a diferença entre os dois é invisível a olho nu e decisiva
  para quem depende de contraste.

Semânticos (`error`, `success`) vêm do tema da aplicação autenticada e não
aparecem na landing — erro em página de vitrine é ruído.

### Tema escuro

A área autenticada responde a `prefers-color-scheme: dark` com uma paleta
própria (`--bg: #101215`, `--primary: #5b8dee` — mais claro, para manter
contraste sobre fundo escuro). A landing é **intencionalmente sempre clara**:
é material institucional, e consistência de apresentação vale mais que
preferência de sistema nesse contexto.

## Typography

Uma família só: a fonte de sistema (`system-ui`). Sem download, sem
*flash of unstyled text*, e o texto já parece nativo em cada plataforma.
Toda a hierarquia vem de **peso e tamanho**, não de variedade tipográfica.

- **Escala agressiva no topo.** `h1` a 3.1rem contra corpo a 1rem — quase
  3:1. Um título grande carrega a página sem precisar de imagem de fundo.
- **`letterSpacing` negativo em títulos.** Fontes de sistema abrem demais em
  tamanho grande; `-0.03em` no `h1` recupera a coesão de logotipo.
- **Peso 800, nunca 900.** O extremo da escala fica irregular entre
  plataformas.
- **`lineHeight` inverso ao tamanho.** 1.06 no `h1`, 1.6 no texto de apoio:
  títulos precisam de bloco compacto, leitura precisa de ar.
- **`eyebrow`** é o rótulo em maiúsculas antes de cada `h2`. Dá contexto sem
  gastar um nível de cabeçalho e mantém a hierarquia semântica limpa.

## Layout

Coluna central de **1160px**, com respiro lateral de 1.5rem. Seções em
destaque (`.lp-alt`) esticam até 1200px e ganham cantos arredondados,
sugerindo um painel sobre a página em vez de uma faixa cortando a tela.

- Grade de recursos: **3 colunas**.
- Grade de números: **4 colunas**.
- Blocos de duas colunas assimétricos (`1.2fr / 0.8fr`) — o texto conduz, o
  cartão de dados apoia. Simetria perfeita aqui pareceria hesitante.

Ponto de quebra único em **860px**: tudo colapsa para uma coluna, números
viram 2×2 e o `h1` cai para 2.3rem. Um único ponto de quebra é uma decisão
deliberada — cada um adicional é mais um estado para manter e regredir.

## Elevation & Depth

Uma só elevação para todos os cartões: `0 10px 30px rgba(15,23,42,0.07)`.

Isso foi uma **correção**. A primeira versão tinha três sombras diferentes
convivendo, e a revisão visual apontou que quebrava a sensação de sistema
coeso. Elevação deve comunicar hierarquia — se tudo está no mesmo nível
lógico, tudo usa a mesma sombra.

A única variação é no `hover` dos cartões de recurso: sombra mais profunda e
`translateY(-3px)`, confirmando que aquele bloco é interativo. Sombras usam
azul-tinta translúcido, nunca preto — preto sobre fundo frio acinzenta.

## Shapes

Raio proporcional ao elemento: 9–10px em botões e marcas, 16–18px em cartões,
26px em painéis de seção, `999px` em pílulas e círculos.

A progressão importa mais que os números: um botão com o mesmo raio de um
painel parece flutuar solto; um painel com raio de botão parece rígido.

## Components

- **`button-primary`** — a ação de maior ênfase. No máximo um por dobra de
  tela. Dentro da faixa de chamada ele **inverte** (fundo branco, texto azul),
  porque ali o azul é o fundo.
- **`button-outline`** — ação secundária. Borda `#c3ccd9`, mais escura que a
  borda dos cartões: em teste visual, uma borda clara demais fazia o botão
  desaparecer no fundo.
- **`card`** — branco, borda de 1px e a elevação padrão. Borda **e** sombra
  juntas: a borda garante a delimitação em telas onde a sombra some.
- **`badge`** — pílula azul-clara para metadados curtos (a lista de stack no
  cabeçalho). Nunca para status dinâmico.
- **`step-marker`** — círculo numerado de 46px. Numeração explícita porque a
  ordem das camadas de arquitetura é significativa.
- **`footer`** — o único bloco escuro. Encerra a página com um limite visual
  firme e sustenta a assinatura pessoal do autor.

### Ícones

**SVG inline, nunca emoji.** Emoji renderiza diferente em cada sistema,
depende de fonte instalada e degrada para retângulo vazio quando falta. Os
ícones usam `stroke="currentColor"`, então herdam a cor do tema
automaticamente — inclusive no escuro.

## Do's and Don'ts

**Faça**

- Trocar `colors.primary` para adaptar o template a uma nova marca. Todo o
  resto acompanha, incluindo ícones.
- Manter cada número exibido na interface **rastreável a uma medição real**.
- Usar `{colors.*}` como referência nos componentes, nunca hex repetido.
- Verificar o contraste ao introduzir qualquer cinza novo em texto.

**Não faça**

- **Não use script embutido.** A política de segurança de conteúdo proíbe
  `unsafe-inline`; "voltar ao topo" é âncora pura, e não JavaScript, por isso.
- **Não publique número inventado.** Uma versão anterior exibia "400+ sessões"
  e "<30ms" sem medição — foi removida. Métrica não verificada é dívida.
- **Não introduza emoji na interface.**
- **Não adicione uma quarta sombra.** Se um elemento parece precisar de
  elevação própria, provavelmente ele pertence a outro nível de hierarquia.
- **Não use `#94a3b8` sobre fundo claro** — 2.56:1, reprova em WCAG AA. Sobre
  o rodapé escuro é legítimo (6.96:1).
- **Não anime nada que se mova sozinho.** As únicas transições são resposta a
  `hover`, e a rolagem suave respeita `prefers-reduced-motion`.
