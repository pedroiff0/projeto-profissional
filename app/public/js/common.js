// Utilitarios compartilhados. Nenhum inline script: a CSP nao permite
// 'unsafe-inline' neste template.

// Escapa texto de origem nao confiavel antes de inseri-lo via innerHTML.
// Inclui aspas para ser seguro tambem dentro de atributos.
function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Wrapper de fetch: sempre same-origin com cookie, sempre JSON, e converte
// resposta de erro numa Error com a mensagem do servidor.
async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* resposta sem corpo */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Erro ${res.status}`);
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }
  return data;
}

function showBox(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function hideBox(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

const showError = (msg) => showBox('error', msg);
const showOk = (msg) => showBox('ok', msg);
const clearBoxes = () => {
  hideBox('error');
  hideBox('ok');
};

document.addEventListener('DOMContentLoaded', () => {
  // Efeito "scrolled" na navbar glass.
  const nav = document.getElementById('ppNav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Idioma (PT/EN/ES/FR) via bandeiras ---------------------------------
  const currentLang = (document.cookie.match(/(?:^|;\s*)lang=([^;]+)/) || [])[1] || 'pt';
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const isActive = btn.dataset.lang === currentLang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
    btn.addEventListener('click', () => {
      document.cookie = `lang=${btn.dataset.lang}; path=/; max-age=${365 * 24 * 60 * 60}`;
      window.location.reload();
    });
  });

  // --- Tema (claro/escuro) ------------------------------------------------
  const themeToggle = document.getElementById('theme-toggle');
  const sun = themeToggle && themeToggle.querySelector('.icon-sun');
  const moon = themeToggle && themeToggle.querySelector('.icon-moon');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    const isDark = theme === 'dark' ||
      (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute('aria-label', isDark
        ? (window.__tThemeLight || 'Mudar para tema claro')
        : (window.__tThemeDark || 'Mudar para tema escuro'));
    }
    if (sun) sun.style.display = isDark ? 'none' : '';
    if (moon) moon.style.display = isDark ? '' : 'none';
  }

  const savedTheme = (document.cookie.match(/(?:^|;\s*)theme=([^;]+)/) || [])[1] || 'auto';
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const isDark = current === 'dark' ||
        (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const next = isDark ? 'light' : 'dark';
      document.cookie = `theme=${next}; path=/; max-age=${365 * 24 * 60 * 60}`;
      applyTheme(next);
    });
  }
});
