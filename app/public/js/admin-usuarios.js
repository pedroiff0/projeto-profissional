document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('tbody');
  const busca = document.getElementById('busca');
  const formNovo = document.getElementById('form-novo');
  let timer;

  function linha(u) {
    // escapeHtml em TODO dado vindo do banco (XSS persistente).
    return `<tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.role)}</td>
      <td>${u.isActive ? 'ativo' : 'inativo'}</td>
      <td>
        <button class="btn-link" data-acao="reset" data-id="${escapeHtml(u.id)}">Resetar senha</button>
        <button class="btn-link" data-acao="toggle" data-id="${escapeHtml(u.id)}" data-ativo="${u.isActive}">
          ${u.isActive ? 'Desativar' : 'Reativar'}
        </button>
      </td>
    </tr>`;
  }

  async function carregar() {
    try {
      const q = encodeURIComponent(busca.value.trim());
      const data = await apiRequest(`/api/admin/users?q=${q}&limit=50`);
      tbody.innerHTML = data.items.length
        ? data.items.map(linha).join('')
        : '<tr><td colspan="5">Nenhum usuario.</td></tr>';
    } catch (err) {
      showError(err.message);
    }
  }

  formNovo?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    try {
      const data = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
          role: document.getElementById('role').value,
        }),
      });
      showOk(`Usuario criado. Senha temporaria (copie agora): ${data.senhaTemporaria}`);
      formNovo.reset();
      carregar();
    } catch (err) {
      showError(err.message);
    }
  });

  tbody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    clearBoxes();
    const { acao, id, ativo } = btn.dataset;
    try {
      if (acao === 'reset') {
        const data = await apiRequest(`/api/admin/users/${id}/reset-password`, { method: 'POST' });
        showOk(`Nova senha temporaria (copie agora): ${data.senhaTemporaria}`);
      } else {
        await apiRequest(`/api/admin/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: ativo !== 'true' }),
        });
        showOk('Usuario atualizado.');
      }
      carregar();
    } catch (err) {
      showError(err.message);
    }
  });

  busca?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(carregar, 300);
  });

  carregar();
});
