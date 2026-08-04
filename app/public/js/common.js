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
  const btn = document.getElementById('btn-logout');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      } finally {
        window.location.href = '/login';
      }
    });
  }
});
