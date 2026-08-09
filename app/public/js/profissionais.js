// Pagina Profissionais: lista em tabela + cadastro (form topo) + edicao via modal. Sem inline (CSP).
// Icones SVG inline (sem emoji): editar (lapis) e remover (lixeira).
(function () {
  const apiBase = (document.querySelector('[data-api-base]') || { dataset: {} }).dataset.apiBase || '/api';
  const rows = document.getElementById('pro-rows');
  const empty = document.getElementById('pro-empty');
  const form = document.getElementById('pro-form');
  const status = document.getElementById('pro-status');

  // Modal de edicao.
  const modal = document.getElementById('pro-modal');
  const editForm = document.getElementById('pro-edit-form');
  const editStatus = document.getElementById('pro-edit-status');
  let editId = null;

  const ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_DEL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';

  function initial(nome) {
    const partes = String(nome || '?').trim().split(/\s+/);
    return ((partes[0] || '?')[0] || '?').toUpperCase();
  }

  function rowHtml(p) {
    const funcao = p.funcao ? '<span class="tag tcard-who">' + escapeHtml(p.funcao) + '</span>' : '<span class="muted">—</span>';
    const contato = p.contato ? escapeHtml(p.contato) : '<span class="muted">—</span>';
    const email = p.email ? '<a href="mailto:' + escapeHtml(p.email) + '">' + escapeHtml(p.email) + '</a>' : '<span class="muted">—</span>';
    return '<tr data-id="' + escapeHtml(String(p._id)) + '">' +
      '<td><div class="name-cell"><span class="avatar-initial">' + escapeHtml(initial(p.nome)) + '</span>' +
        '<div><div class="cell-name">' + escapeHtml(p.nome) + '</div></div></div></td>' +
      '<td class="cell-sub">' + funcao + '</td>' +
      '<td class="cell-sub">' + contato + '</td>' +
      '<td class="cell-sub">' + email + '</td>' +
      '<td class="cell-actions"><span class="row-actions">' +
        '<button type="button" class="icon-btn js-edit" data-id="' + escapeHtml(String(p._id)) + '" aria-label="Editar">' + ICON_EDIT + '</button>' +
        '<button type="button" class="icon-btn danger js-del" data-id="' + escapeHtml(String(p._id)) + '" aria-label="Remover">' + ICON_DEL + '</button>' +
      '</span></td>' +
    '</tr>';
  }

  async function carregar() {
    try {
      const r = await apiRequest(apiBase + '/professionals?limit=500');
      const items = r.items || [];
      rows.innerHTML = items.map(rowHtml).join('');
      if (empty) empty.hidden = items.length > 0;
    } catch (e) { rows.innerHTML = '<tr><td colspan="4" class="err">' + escapeHtml(e.message) + '</td></tr>'; }
  }

  function abrirModal(p) {
    editId = p._id;
    editForm.nome.value = p.nome || '';
    editForm.funcao.value = p.funcao || '';
    editForm.contato.value = p.contato || '';
    editForm.email.value = p.email || '';
    editStatus.textContent = '';
    modal.hidden = false;
  }
  function fecharModal() { modal.hidden = true; editId = null; }

  if (modal) {
    modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', fecharModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) fecharModal(); });
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!editId) return;
      const body = { nome: editForm.nome.value.trim(), funcao: editForm.funcao.value.trim(), contato: editForm.contato.value.trim(), email: editForm.email.value.trim() };
      if (!body.nome) return;
      editStatus.textContent = '…';
      try {
        await apiRequest(apiBase + '/professionals/' + editId, { method: 'PATCH', body: JSON.stringify(body) });
        editStatus.textContent = '✔';
        setTimeout(fecharModal, 500);
        carregar();
      } catch (err) { editStatus.textContent = err.message; }
    });
  }

  // Cadastro (form do topo) — apenas criacao.
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = { nome: form.nome.value.trim(), funcao: form.funcao.value.trim(), contato: form.contato.value.trim(), email: form.email.value.trim() };
      if (!body.nome) return;
      status.textContent = '…';
      try {
        await apiRequest(apiBase + '/professionals', { method: 'POST', body: JSON.stringify(body) });
        status.textContent = '✔';
        form.reset();
        setTimeout(() => { status.textContent = ''; }, 1500);
        carregar();
      } catch (err) { status.textContent = err.message; }
    });
  }

  if (rows) {
    rows.addEventListener('click', async (e) => {
      const del = e.target.closest('.js-del');
      const edt = e.target.closest('.js-edit');
      if (del) {
        if (!confirm('Remover este profissional?')) return;
        try {
          await apiRequest(apiBase + '/professionals/' + del.dataset.id, { method: 'DELETE' });
          carregar();
        } catch (err) { alert(err.message); }
      } else if (edt) {
        try {
          const p = (await apiRequest(apiBase + '/professionals/' + edt.dataset.id));
          abrirModal(p.professional || p);
        } catch (err) { alert(err.message); }
      }
    });
  }

  carregar();
})();
