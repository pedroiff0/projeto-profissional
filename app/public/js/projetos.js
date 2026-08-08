// Pagina Projetos: lista em tabela + cadastro (form topo) + edicao via modal. Sem inline (CSP).
// Icones SVG inline (sem emoji): editar (lapis) e remover (lixeira).
(function () {
  const apiBase = (document.querySelector('[data-api-base]') || { dataset: {} }).dataset.apiBase || '/api';
  const rows = document.getElementById('proj-rows');
  const empty = document.getElementById('proj-empty');
  const form = document.getElementById('proj-form');
  const status = document.getElementById('proj-status');

  // Modal de edicao.
  const modal = document.getElementById('proj-modal');
  const editForm = document.getElementById('proj-edit-form');
  const editStatus = document.getElementById('proj-edit-status');
  let editId = null;

  const ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_DEL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';

  function initial(nome) {
    const partes = String(nome || '?').trim().split(/\s+/);
    return ((partes[0] || '?')[0] || '?').toUpperCase();
  }

  // Extrai o ObjectId de um valor "nome|id" vindo do <datalist>.
  function respId(val) {
    if (!val) return '';
    const partes = String(val).split('|');
    return partes[1] || partes[0] || '';
  }

  function renderMd(text) {
    if (!text) return '';
    const html = window.marked ? marked.parse(text) : escapeHtml(text);
    const limpo = window.DOMPurify ? DOMPurify.sanitize(html) : html;
    return limpo;
  }

  function rowHtml(p) {
    const tags = (p.tags || []).map((t) => '<span class="tag">#' + escapeHtml(t) + '</span>').join(' ');
    const desc = p.description ? '<div class="md-block">' + renderMd(p.description) + '</div>' : '<span class="muted">—</span>';
    const resp = p.responsavelId ? (p.responsavelNome || (typeof p.responsavelId === 'object' && p.responsavelId.name) || '') : '';
    const respCell = resp ? '<div class="cell-name">' + escapeHtml(resp) + '</div>' : '<span class="muted">—</span>';
    return '<tr data-id="' + escapeHtml(String(p._id)) + '">' +
      '<td><div class="name-cell"><span class="avatar-initial">' + escapeHtml(initial(p.name)) + '</span>' +
        '<div><div class="cell-name">' + escapeHtml(p.name) + '</div></div></div></td>' +
      '<td class="cell-sub">' + desc + '</td>' +
      '<td class="cell-sub">' + respCell + '</td>' +
      '<td>' + (tags || '<span class="muted">—</span>') + '</td>' +
      '<td class="cell-actions"><span class="row-actions">' +
        '<button type="button" class="icon-btn js-edit" data-id="' + escapeHtml(String(p._id)) + '" aria-label="Editar">' + ICON_EDIT + '</button>' +
        '<button type="button" class="icon-btn danger js-del" data-id="' + escapeHtml(String(p._id)) + '" aria-label="Remover">' + ICON_DEL + '</button>' +
      '</span></td>' +
    '</tr>';
  }

  async function carregar() {
    try {
      const r = await apiRequest(apiBase + '/projects?limit=500');
      const items = r.items || [];
      rows.innerHTML = items.map(rowHtml).join('');
      if (empty) empty.hidden = items.length > 0;
      if (window.renderMathInElement) {
        rows.querySelectorAll('.md-block').forEach((el) => {
          try { renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }] }); } catch (e) {}
        });
      }
    } catch (e) { rows.innerHTML = '<tr><td colspan="5" class="err">' + escapeHtml(e.message) + '</td></tr>'; }
  }

  // Modal: abre preenchido para edicao.
  function abrirModal(p) {
    editId = p._id;
    editForm.name.value = p.name || '';
    editForm.description.value = p.description || '';
    editForm.tags.value = (p.tags || []).join(', ');
    if (editForm.responsavelId) {
      const rid = p.responsavelId && p.responsavelId._id ? String(p.responsavelId._id) : (p.responsavelId || '');
      const rnome = p.responsavelNome || (typeof p.responsavelId === 'object' && p.responsavelId.name) || '';
      editForm.responsavelId.value = rnome ? (rnome + '|' + rid) : rid;
    }
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
      const tags = editForm.tags.value.split(',').map((s) => s.trim()).filter(Boolean);
      const body = { name: editForm.name.value.trim(), description: editForm.description.value.trim(), tags, responsavelId: respId(editForm.responsavelId.value) };
      if (!body.name || !body.responsavelId) { editStatus.textContent = 'Responsável obrigatório.'; return; }
      editStatus.textContent = '…';
      try {
        await apiRequest(apiBase + '/projects/' + editId, { method: 'PATCH', body: JSON.stringify(body) });
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
      const tags = form.tags.value.split(',').map((s) => s.trim()).filter(Boolean);
      const body = { name: form.name.value.trim(), description: form.description.value.trim(), tags, responsavelId: respId(form.responsavelId.value) };
      if (!body.name || !body.responsavelId) { status.textContent = 'Responsável obrigatório.'; return; }
      status.textContent = '…';
      try {
        await apiRequest(apiBase + '/projects', { method: 'POST', body: JSON.stringify(body) });
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
        if (!confirm('Remover este projeto?')) return;
        try {
          await apiRequest(apiBase + '/projects/' + del.dataset.id, { method: 'DELETE' });
          carregar();
        } catch (err) { alert(err.message); }
      } else if (edt) {
        try {
          const p = (await apiRequest(apiBase + '/projects/' + edt.dataset.id));
          abrirModal(p.project || p);
        } catch (err) { alert(err.message); }
      }
    });
  }

  carregar();
})();
