// Utilitarios compartilhados. Nenhum inline script: a CSP nao permite
// 'unsafe-inline' neste template.

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
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
const clearBoxes = () => { hideBox('error'); hideBox('ok'); };

document.addEventListener('DOMContentLoaded', () => {
  // --- Tema (claro/escuro) ------------------------------------------------
  const themeToggle = document.getElementById('btn-tema');
  const root = document.documentElement;
  const sun = themeToggle && themeToggle.querySelector('.ic-sol');
  const moon = themeToggle && themeToggle.querySelector('.ic-lua');

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
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

  // --- Idioma (PT/EN/ES/FR) por BANDEIRAS SVG ----------------------------
  const langButtons = Array.from(document.querySelectorAll('.lang-btn'));
  function setLangPressed(lang) {
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  const curLang = (document.cookie.match(/(?:^|;\s*)lang=([^;]+)/) || [])[1] || 'pt';
  setLangPressed(curLang);
  langButtons.forEach((b) => {
    b.addEventListener('click', () => {
      const next = b.dataset.lang;
      if (next === curLang) return;
      document.cookie = `lang=${next}; path=/; max-age=${365 * 24 * 60 * 60}`;
      setLangPressed(next);
      const params = new URLSearchParams(window.location.search);
      params.set('lang', next);
      window.location.search = params.toString();
    });
  });
});
