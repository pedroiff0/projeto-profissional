// Quadro (kanban) da aplicacao de exemplo. Sem inline script (CSP).
(function () {
  const board = document.getElementById('board');
  if (!board) return;
  const apiBase = board.dataset.apiBase || '/api';

  const STATUS_LABEL = {
    planejado: 'A fazer', em_andamento: 'Em andamento',
    pausado: 'Pausado', concluido: 'Concluído',
  };

  function coluna(status) { return document.querySelector('.board-cards[data-status="' + status + '"]'); }
  function contador(status) {
    const col = document.querySelector('.board-col[data-status="' + status + '"] .board-count');
    if (col) col.textContent = coluna(status).querySelectorAll('.tcard').length;
  }
  function vazio(status) {
    const box = coluna(status);
    const empty = box.parentElement.querySelector('.board-empty');
    if (!box.querySelector('.tcard') && !empty) {
      const p = document.createElement('p');
      p.className = 'board-empty muted';
      p.textContent = 'Nenhuma tarefa aqui.';
      box.appendChild(p);
    } else if (box.querySelector('.tcard') && empty) { empty.remove(); }
  }

  function cardEl(t) {
    const el = document.createElement('article');
    el.className = 'tcard';
    el.dataset.id = t._id;
    el.setAttribute('draggable', 'true');
    el.dataset.projeto = t.projetoId || '';
    el.dataset.profissional = t.profissionalId || '';
    el.dataset.tags = (t.tags || []).join(',');
    el.dataset.inicio = t.dataInicio ? toDateInput(t.dataInicio) : '';
    el.dataset.prazo = t.prazo ? toDateInput(t.prazo) : '';
    // Nomes vêm do banco: do objeto (após reload) ou do <select> do form (na criacao).
    const projSel = document.querySelector('#task-form select[name="projetoId"]');
    const profSel = document.querySelector('#task-form select[name="profissionalId"]');
    const projNome = t.projetoNome || (t.projetoId && projSel ? (projSel.querySelector('option[value="' + t.projetoId + '"]') || {}).textContent : '') || '';
    const profNome = t.profissionalNome || (t.profissionalId && profSel ? (profSel.querySelector('option[value="' + t.profissionalId + '"]') || {}).textContent : '') || '';
    const tags = (t.tags || []).map((x) => '<span class="tag">#' + escapeHtml(x) + '</span>').join('');
    const meta = [
      t.projetoId ? '<span class="tcard-tag tcard-proj" data-id="' + escapeHtml(String(t.projetoId)) + '">' + escapeHtml(projNome) + '</span>' : '',
      t.profissionalId ? '<span class="tcard-tag tcard-who" data-id="' + escapeHtml(String(t.profissionalId)) + '">' + escapeHtml(profNome) + '</span>' : '',
    ].join('');
    const diffBadge = (t.dificuldade) ? '<span class="tcard-tag tcard-diff" title="Dificuldade (Fibonacci)">' + escapeHtml(String(t.dificuldade)) + '</span>' : '';
    const focusBadge = (t.minutosFoco) ? '<span class="tcard-tag tcard-focus" title="Minutos de foco">' + escapeHtml(String(t.minutosFoco)) + 'm</span>' : '';
    const entregue = (t.entregueEm) ? '<span class="tcard-tag tcard-done" title="Entregue em">✓ ' + new Date(t.entregueEm).toLocaleDateString() + '</span>' : '';
    el.innerHTML =
      '<div class="tcard-top"><h3>' + escapeHtml(t.titulo) + '</h3>' +
      '<button class="tcard-del" data-id="' + t._id + '" type="button" aria-label="Remover">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      (t.descricao ? '<p class="tcard-desc">' + renderMdInline(t.descricao) + '</p>' : '') +
      (meta ? '<div class="tcard-meta">' + meta + diffBadge + focusBadge + entregue + '</div>' : '') +
      (tags ? '<div class="tcard-tags">' + tags + '</div>' : '') +
      '<div class="tcard-foot"><select class="tcard-move" data-id="' + t._id + '" aria-label="Mover para">' +
      Object.keys(STATUS_LABEL).map((s) => '<option value="' + s + '"' + (s === t.status ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>').join('') +
      '</select></div>';
    return el;
  }

  // --- Markdown + LaTeX (vendor self-hosted: marked + DOMPurify + KaTeX) ---
  function renderMarkdown(src) {
    if (!src) return '';
    const raw = window.marked ? window.marked.parse(src, { breaks: true, gfm: true }) : escapeHtml(src);
    const clean = window.DOMPurify ? window.DOMPurify.sanitize(raw, { ADD_TAGS: ['math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'msup', 'span'], ADD_ATTR: ['aria-hidden', 'encoding', 'xmlns'] }) : raw;
    return clean;
  }
  function renderMdInline(src) {
    // Versao curta para o card: sem blocos pesados, ate 2 quebras.
    const txt = (src || '').split('\n').slice(0, 3).join('\n');
    return renderMarkdown(txt);
  }
  function typeset(el) {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch (_) {}
    }
  }

  async function atualizar(id, patch) {
    try { await apiRequest(apiBase + '/tasks/' + id, { method: 'PATCH', body: JSON.stringify(patch) }); }
    catch (e) { alert(e.message); }
  }

  // Renderiza o markdown/LaTeX das descricoes ja existentes no quadro.
  function renderizarCards() {
    document.querySelectorAll('.tcard-desc').forEach((el) => {
      const txt = el.textContent;
      if (txt && (txt.includes('*') || txt.includes('$') || txt.includes('#') || txt.includes('`'))) {
        el.innerHTML = renderMarkdown(txt);
        typeset(el);
      }
    });
  }
  renderizarCards();

  // SSR cards (servidor) nao tem o atributo draggable: garantir arrastavel.
  document.querySelectorAll('.tcard').forEach((c) => c.setAttribute('draggable', 'true'));

  // --- Modal de detalhe da tarefa ---
  const modal = document.getElementById('task-modal');
  let modalTask = null;
  function openModal(task) {
    modalTask = task;
    document.getElementById('tm-title').value = task.titulo || '';
    document.getElementById('tm-status').value = task.status || 'planejado';
    const badge = document.getElementById('tm-status-badge');
    badge.dataset.status = task.status || 'planejado';
    document.getElementById('tm-project').value = task.projetoId || '';
    document.getElementById('tm-assignee').value = task.profissionalId || '';
    const tagsEl = document.getElementById('tm-tags');
    if (tagsEl) tagsEl.value = (task.tags || []).join(', ');
    document.getElementById('tm-datainicio').value = task.dataInicio ? toDateInput(task.dataInicio) : '';
    document.getElementById('tm-prazo').value = task.prazo ? toDateInput(task.prazo) : '';
    document.getElementById('tm-horario').value = task.horario || '';
    const view = document.getElementById('tm-view');
    view.innerHTML = renderMarkdown(task.descricao || '');
    typeset(view);
    document.getElementById('tm-edit').value = task.descricao || '';
    document.getElementById('tm-edit').hidden = true;
    view.hidden = false;
    document.getElementById('tm-edit-btn').hidden = false;
    document.getElementById('tm-save').hidden = true;
    document.getElementById('tm-cancel').hidden = true;
    document.getElementById('tm-status-msg').textContent = '';
    renderFiles(task.arquivos || []);
    renderLinks(task.links || []);
    renderComments(task.comentarios || []);
    // Pomodoro da tarefa
    document.getElementById('tm-focus-min').textContent = task.minutosFoco || 0;
    document.getElementById('tm-pomo-start').hidden = false;
    document.getElementById('tm-pomo-stop').hidden = true;
    document.getElementById('tm-pomo-status').textContent = '';
    modal.hidden = false;
  }
  function toDateInput(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function renderFiles(arquivos) {
    const ul = document.getElementById('tm-files');
    if (!arquivos.length) { ul.innerHTML = '<li class="empty muted">—</li>'; return; }
    ul.innerHTML = arquivos.map((a) => '<li><a href="' + escapeAttr(a.url) + '" target="_blank" rel="noopener">' + escapeHtml(a.nome) + '</a></li>').join('');
  }
  function renderLinks(links) {
    const ul = document.getElementById('tm-links');
    if (!links.length) { ul.innerHTML = '<li class="empty muted">—</li>'; return; }
    ul.innerHTML = links.map((l) => '<li><a href="' + escapeAttr(l.url) + '" target="_blank" rel="noopener">' + escapeHtml(l.titulo || l.url) + '</a></li>').join('');
  }
  function renderComments(comentarios) {
    const ul = document.getElementById('tm-comments');
    if (!comentarios.length) { ul.innerHTML = '<li class="empty muted">—</li>'; return; }
    ul.innerHTML = comentarios.map((c) => {
      const quando = c.criadoEm ? new Date(c.criadoEm).toLocaleString() : '';
      return '<li class="comment"><div class="comment-head"><strong>' + escapeHtml(c.autor || '—') + '</strong><span class="muted small">' + escapeHtml(quando) + '</span></div><p>' + escapeHtml(c.texto) + '</p></li>';
    }).join('');
  }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }
  function closeModal() { modal.hidden = true; modalTask = null; }

  // Pomodoro VINCULADO a tarefa: ao concluir, registra minutosFoco na tarefa (e no resumo do dono).
  let taskPomoTimer = null;
  function setupTaskPomo() {
    const startBtn = document.getElementById('tm-pomo-start');
    const stopBtn = document.getElementById('tm-pomo-stop');
    const statusEl = document.getElementById('tm-pomo-status');
    const minEl = document.getElementById('tm-focus-min');
    if (!startBtn) return;
    startBtn.addEventListener('click', () => {
      if (taskPomoTimer || !modalTask) return;
      const duracao = 25 * 60; let restante = duracao;
      startBtn.hidden = true; stopBtn.hidden = false;
      const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      statusEl.textContent = fmt(restante);
      taskPomoTimer = setInterval(() => {
        restante -= 1; statusEl.textContent = fmt(restante);
        if (restante <= 0) {
          clearInterval(taskPomoTimer); taskPomoTimer = null;
          startBtn.hidden = false; stopBtn.hidden = true;
          statusEl.textContent = 'Registrando…';
          apiRequest(apiBase + '/tasks/' + modalTask._id + '/foco', { method: 'POST', body: JSON.stringify({ minutos: 25 }) })
            .then((d) => { if (d && d.task) minEl.textContent = d.task.minutosFoco || 0; statusEl.textContent = 'Pomodoro concluído! +25 min'; })
            .catch(() => { statusEl.textContent = 'Erro ao registrar foco.'; });
        }
      }, 1000);
    });
    stopBtn.addEventListener('click', () => {
      if (taskPomoTimer) { clearInterval(taskPomoTimer); taskPomoTimer = null; }
      startBtn.hidden = false; stopBtn.hidden = true; statusEl.textContent = '';
    });
  }

  if (modal) {
    modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
    setupTaskPomo();

    document.getElementById('tm-edit-btn').addEventListener('click', () => {
      document.getElementById('tm-view').hidden = true;
      const ed = document.getElementById('tm-edit'); ed.hidden = false; ed.focus();
      document.getElementById('tm-edit-btn').hidden = true;
      document.getElementById('tm-save').hidden = false;
      document.getElementById('tm-cancel').hidden = false;
    });
    document.getElementById('tm-cancel').addEventListener('click', () => {
      const ed = document.getElementById('tm-edit'); ed.hidden = true; ed.value = modalTask.descricao || '';
      const view = document.getElementById('tm-view'); view.hidden = false;
      document.getElementById('tm-edit-btn').hidden = false;
      document.getElementById('tm-save').hidden = true;
      document.getElementById('tm-cancel').hidden = true;
    });
    async function saveModal() {
      const msg = document.getElementById('tm-status-msg');
      const tagsVal = (document.getElementById('tm-tags').value || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12);
      const patch = {
        titulo: document.getElementById('tm-title').value.trim(),
        descricao: document.getElementById('tm-edit').value,
        status: document.getElementById('tm-status').value,
        projetoId: document.getElementById('tm-project').value || null,
        profissionalId: document.getElementById('tm-assignee').value || null,
        tags: tagsVal,
        dataInicio: document.getElementById('tm-datainicio').value || null,
        prazo: document.getElementById('tm-prazo').value || null,
        horario: document.getElementById('tm-horario').value || '',
        dificuldade: document.getElementById('tm-diff').value ? Number(document.getElementById('tm-diff').value) : null,
      };
      msg.textContent = 'Salvando…';
      try {
        const data = await apiRequest(apiBase + '/tasks/' + modalTask._id, { method: 'PATCH', body: JSON.stringify(patch) });
        const t = data.task || Object.assign(modalTask, patch);
        modalTask = t;
        const badge = document.getElementById('tm-status-badge');
        badge.dataset.status = t.status;
        const view = document.getElementById('tm-view');
        view.innerHTML = renderMarkdown(t.descricao || ''); typeset(view);
        view.hidden = false; document.getElementById('tm-edit').hidden = true;
        document.getElementById('tm-edit-btn').hidden = false;
        document.getElementById('tm-save').hidden = true; document.getElementById('tm-cancel').hidden = true;
        // Atualiza o card no quadro.
        const card = document.querySelector('.tcard[data-id="' + t._id + '"]');
        if (card) {
          card.querySelector('h3').textContent = t.titulo;
          const desc = card.querySelector('.tcard-desc');
          if (t.descricao) { if (desc) desc.innerHTML = renderMdInline(t.descricao); else card.insertAdjacentHTML('beforeend', '<p class="tcard-desc">' + renderMdInline(t.descricao) + '</p>'); }
          else if (desc) desc.remove();
          const move = card.querySelector('.tcard-move'); if (move) move.value = t.status;
          const tagsBox = card.querySelector('.tcard-tags');
          const tagsHtml = (t.tags && t.tags.length) ? '<div class="tcard-tags">' + t.tags.map((x) => '<span class="tag">#' + escapeHtml(x) + '</span>').join('') + '</div>' : '';
          if (tagsBox) tagsBox.outerHTML = tagsHtml;
          else if (tagsHtml) card.insertAdjacentHTML('beforeend', tagsHtml);
        }
        // Se o status mudou de coluna, move o card.
        if (card && card.parentElement.dataset.status !== t.status) {
          const de = card.parentElement.dataset.status;
          coluna(t.status).appendChild(card); contador(de); contador(t.status); vazio(de); vazio(t.status);
        }
        msg.textContent = 'Salvo.';
        setTimeout(() => { msg.textContent = ''; }, 1500);
      } catch (err) { msg.textContent = err.message; }
    }
    document.getElementById('tm-save').addEventListener('click', saveModal);
    ['tm-status', 'tm-project', 'tm-assignee'].forEach((id) =>
      document.getElementById(id).addEventListener('change', saveModal));

    // Enviar comentario (adiciona ao thread e persiste via PATCH).
    document.getElementById('tm-comment-btn').addEventListener('click', async () => {
      const input = document.getElementById('tm-comment');
      const texto = input.value.trim();
      if (!texto || !modalTask) return;
      const msg = document.getElementById('tm-status-msg');
      msg.textContent = 'Enviando…';
      const comentarios = (modalTask.comentarios || []).slice();
      comentarios.push({ autor: modalTask.ownerName || 'Você', texto });
      try {
        const data = await apiRequest(apiBase + '/tasks/' + modalTask._id, { method: 'PATCH', body: JSON.stringify({ comentarios }) });
        const t = data.task || modalTask;
        modalTask = t;
        renderComments(t.comentarios || comentarios);
        input.value = '';
        msg.textContent = 'Comentário enviado.';
        setTimeout(() => { msg.textContent = ''; }, 1500);
      } catch (err) { msg.textContent = err.message; }
    });
  }

  // Painel de cadastro.
  const btnNova = document.getElementById('btn-nova');
  const cadastro = document.getElementById('cadastro');
  const form = document.getElementById('task-form');
  const status = document.getElementById('task-status');
  if (btnNova && cadastro) {
    btnNova.addEventListener('click', () => { cadastro.hidden = !cadastro.hidden; if (!cadastro.hidden) form.titulo.focus(); });
    document.getElementById('btn-cancel').addEventListener('click', () => { cadastro.hidden = true; });
  }
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tags = form.tags.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12);
      const body = {
        titulo: form.titulo.value.trim(),
        descricao: form.descricao.value.trim(),
        projetoId: form.projetoId.value || null,
        profissionalId: form.profissionalId.value || null,
        tags,
      };
      if (!body.titulo) return;
      status.textContent = 'Salvando…';
      try {
        const data = await apiRequest(apiBase + '/tasks', { method: 'POST', body: JSON.stringify(body) });
        const box = coluna('planejado');
        const v = box.querySelector('.board-empty'); if (v) v.remove();
        box.insertBefore(cardEl(data.task), box.firstChild);
        contador('planejado'); vazio('planejado');
        form.reset(); cadastro.hidden = true; status.textContent = '';
      } catch (err) { status.textContent = err.message; }
    });
  }

  // Abrir modal ao clicar no cartao (exceto botoes de remover/mover/editar).
  // O botao de editar tem handler proprio abaixo.
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.tcard-del') || e.target.closest('.tcard-move') || e.target.closest('.tcard-edit')) return;
    const card = e.target.closest('.tcard');
    if (!card) return;
    const id = card.dataset.id;
    try {
      const data = await apiRequest(apiBase + '/tasks/' + id);
      openModal(data.task || data);
    } catch (err) { alert(err.message); }
  });

  // Botao de editar (icone) no cartao: abre o modal de detalhe/edicao.
  board.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.tcard-edit');
    if (!editBtn) return;
    const id = editBtn.dataset.id;
    try {
      const data = await apiRequest(apiBase + '/tasks/' + id);
      openModal(data.task || data);
    } catch (err) { alert(err.message); }
  });

  // --- Drag & drop entre colunas (altera o status) ---
  let dragId = null;
  board.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.tcard');
    if (!card) return;
    dragId = card.dataset.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {}
  });
  board.addEventListener('dragend', (e) => {
    const card = e.target.closest('.tcard');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.board-col.drag-over').forEach((c) => c.classList.remove('drag-over'));
    dragId = null;
  });
  board.querySelectorAll('.board-cards').forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.closest('.board-col').classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) zone.closest('.board-col').classList.remove('drag-over');
    });
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const target = zone.closest('.board-col');
      target.classList.remove('drag-over');
      const id = dragId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
      if (!id) return;
      const card = document.querySelector('.tcard[data-id="' + id + '"]');
      const novo = target.dataset.status;
      const atual = card ? card.parentElement.dataset.status : null;
      if (!card || atual === novo) return;
      card.classList.add('dragging');
      try {
        await atualizar(id, { status: novo });
        coluna(novo).insertBefore(card, coluna(novo).firstChild);
        contador(atual); contador(novo); vazio(atual); vazio(novo);
      } catch (err) {
        card.classList.remove('dragging');
      }
    });
  });

  // Mover de coluna.
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('.tcard-move');
    if (!sel) return;
    const id = sel.dataset.id; const para = sel.value;
    const card = sel.closest('.tcard'); const de = card.parentElement.dataset.status;
    await atualizar(id, { status: para });
    coluna(para).appendChild(card);
    contador(de); contador(para); vazio(de); vazio(para);
  });

  // Remover.
  document.addEventListener('click', async (e) => {
    const del = e.target.closest('.tcard-del');
    if (!del) return;
    if (!confirm('Remover esta tarefa?')) return;
    const id = del.dataset.id; const card = del.closest('.tcard'); const de = card.parentElement.dataset.status;
    try {
      await apiRequest(apiBase + '/tasks/' + id, { method: 'DELETE' });
      card.remove(); contador(de); vazio(de);
    } catch (err) { alert(err.message); }
  });

  // --- Filtros do quadro (client-side, instantaneo) ---
  const fPessoa = document.getElementById('f-pessoa');
  const fProjeto = document.getElementById('f-projeto');
  const fTags = document.getElementById('f-tags');
  const fInicioDe = document.getElementById('f-inicio-de');
  const fInicioAte = document.getElementById('f-inicio-ate');
  const fPrazoDe = document.getElementById('f-prazo-de');
  const fPrazoAte = document.getElementById('f-prazo-ate');
  const fClear = document.getElementById('f-clear');
  const fSummary = document.getElementById('f-summary');

  function cardMatch(card) {
    const pessoa = fPessoa ? fPessoa.value : '';
    const projeto = fProjeto ? fProjeto.value : '';
    const tags = (fTags && fTags.value || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const iDe = fInicioDe && fInicioDe.value;
    const iAte = fInicioAte && fInicioAte.value;
    const pDe = fPrazoDe && fPrazoDe.value;
    const pAte = fPrazoAte && fPrazoAte.value;

    if (pessoa && card.dataset.profissional !== pessoa) return false;
    if (projeto && card.dataset.projeto !== projeto) return false;
    if (tags.length) {
      const ct = (card.dataset.tags || '').split(',').map((s) => s.trim().toLowerCase());
      if (!tags.every((t) => ct.includes(t))) return false;
    }
    const ini = card.dataset.inicio || '';
    const pra = card.dataset.prazo || '';
    if (iDe && (!ini || ini < iDe)) return false;
    if (iAte && (!ini || ini > iAte)) return false;
    if (pDe && (!pra || pra < pDe)) return false;
    if (pAte && (!pra || pra > pAte)) return false;
    return true;
  }

  function applyFilters() {
    let visiveis = 0;
    let total = 0;
    document.querySelectorAll('.tcard').forEach((card) => {
      total += 1;
      const ok = cardMatch(card);
      card.style.display = ok ? '' : 'none';
      if (ok) visiveis += 1;
    });
    // Atualiza contadores por coluna considerando apenas visiveis.
    Object.keys(STATUS_LABEL).forEach((st) => {
      const box = coluna(st);
      if (!box) return;
      const n = box.querySelectorAll('.tcard:not([style*="display: none"])').length;
      const count = document.querySelector('.board-col[data-status="' + st + '"] .board-count');
      if (count) count.textContent = n;
    });
    if (fSummary) {
      const ativo = [fPessoa, fProjeto].some((s) => s && s.value) ||
        (fTags && fTags.value.trim()) || iAlgum();
      fSummary.textContent = ativo ? (visiveis + ' ' + (window.__t ? window.__t('board.filtered') : 'filtradas') + ' / ' + total) : '';
    }
    function iAlgum() {
      return [fInicioDe, fInicioAte, fPrazoDe, fPrazoAte].some((e) => e && e.value);
    }
  }

  [fPessoa, fProjeto].forEach((s) => s && s.addEventListener('change', applyFilters));
  [fTags, fInicioDe, fInicioAte, fPrazoDe, fPrazoAte].forEach((e) => e && e.addEventListener('input', applyFilters));
  if (fClear) fClear.addEventListener('click', () => {
    [fPessoa, fProjeto].forEach((s) => s && (s.value = ''));
    [fTags, fInicioDe, fInicioAte, fPrazoDe, fPrazoAte].forEach((e) => e && (e.value = ''));
    applyFilters();
  });

  // Botao de impressao: gera uma visao limpa do quadro (respeita filtros ativos).
  const btnImprimir = document.getElementById('btn-imprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', () => {
      document.body.classList.add('printing-board');
      window.print();
      // Remove a classe apos a impressao (ou cancelamento) para restaurar a UI.
      const limpar = () => document.body.classList.remove('printing-board');
      window.addEventListener('afterprint', limpar, { once: true });
      setTimeout(limpar, 1000);
    });
  }

  const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
  // --- Comentarios: editar / remover ---
  function renderComments(comentarios) {
    const ul = document.getElementById('tm-comments');
    if (!comentarios.length) { ul.innerHTML = '<li class="empty muted">—</li>'; return; }
    ul.innerHTML = comentarios.map((c, i) => {
      const quando = c.criadoEm ? new Date(c.criadoEm).toLocaleString() : '';
      const tEdit = (window.__t ? window.__t('comEdit') : 'Editar');
      const tDel = (window.__t ? window.__t('comDelete') : 'Excluir');
      return '<li class="comment" data-idx="' + i + '">' +
        '<div class="comment-head"><strong>' + escapeHtml(c.autor || '—') + '</strong>' +
        '<span class="muted small">' + escapeHtml(quando) + '</span></div>' +
        '<p class="comment-text">' + escapeHtml(c.texto) + '</p>' +
        '<div class="comment-actions">' +
        '<button class="btn-sm comment-edit" data-idx="' + i + '" type="button">' + ICON_EDIT + '<span>' + escapeHtml(tEdit) + '</span></button>' +
        '<button class="btn-sm comment-del" data-idx="' + i + '" type="button">' + ICON_DEL + '<span>' + escapeHtml(tDel) + '</span></button>' +
        '</div></li>';
    }).join('');
  }

  if (modal) {
    document.getElementById('tm-comments').addEventListener('click', async (e) => {
      const ed = e.target.closest('.comment-edit');
      const del = e.target.closest('.comment-del');
      if (!ed && !del) return;
      const idx = Number((ed || del).dataset.idx);
      if (del) {
        if (!confirm('Excluir este comentário?')) return;
        const comentarios = (modalTask.comentarios || []).slice();
        comentarios.splice(idx, 1);
        await patchComentarios(comentarios);
        return;
      }
      // Editar: troca o <p> por textarea inline.
      const li = ed.closest('.comment');
      const p = li.querySelector('.comment-text');
      if (li.querySelector('textarea')) return;
      const ta = document.createElement('textarea');
      ta.className = 'comment-edit-area';
      ta.maxLength = 2000;
      ta.value = modalTask.comentarios[idx].texto;
      p.replaceWith(ta); ta.focus();
      const salvar = document.createElement('button');
      salvar.className = 'btn-sm'; salvar.type = 'button'; salvar.textContent = (window.__t ? window.__t('board.save') : 'Salvar');
      const cancel = document.createElement('button');
      cancel.className = 'btn-sm btn-outline'; cancel.type = 'button'; cancel.textContent = (window.__t ? window.__t('comCancel') : 'Cancelar');
      li.querySelector('.comment-actions').appendChild(salvar);
      li.querySelector('.comment-actions').appendChild(cancel);
      salvar.addEventListener('click', async () => {
        const comentarios = (modalTask.comentarios || []).slice();
        comentarios[idx] = Object.assign({}, comentarios[idx], { texto: ta.value.trim() || comentarios[idx].texto });
        await patchComentarios(comentarios);
      });
      cancel.addEventListener('click', () => renderComments(modalTask.comentarios || []));
    });
  }

  async function patchComentarios(comentarios) {
    const msg = document.getElementById('tm-status-msg');
    msg.textContent = 'Salvando…';
    // Normaliza para o schema (autor/texto sempre strings; remove campos nulos).
    const limpos = (comentarios || []).map((c) => ({
      autor: String(c.autor || c.autorId || '—'),
      autorId: c.autorId || undefined,
      texto: String(c.texto || ''),
      criadoEm: c.criadoEm || undefined,
    })).filter((c) => c.texto.trim().length > 0);
    try {
      const data = await apiRequest(apiBase + '/tasks/' + modalTask._id, { method: 'PATCH', body: JSON.stringify({ comentarios: limpos }) });
      const t = data.task || modalTask;
      modalTask = t;
      renderComments(t.comentarios || limpos);
      msg.textContent = 'Salvo.';
      setTimeout(() => { msg.textContent = ''; }, 1500);
    } catch (err) { msg.textContent = err.message; }
  }

  // Recarregar demonstracao.
  const btnDemo = document.getElementById('btn-demo');
  const demoStatus = document.getElementById('demo-status');
  if (btnDemo) {
    btnDemo.addEventListener('click', async () => {
      btnDemo.disabled = true; demoStatus.textContent = 'Recarregando…';
      try {
        await apiRequest(btnDemo.dataset.demoApi, { method: 'POST', body: JSON.stringify({ force: true }) });
        demoStatus.textContent = 'Pronto. Recarregando a página…';
        setTimeout(() => { window.location.reload(); }, 600);
      } catch (err) { demoStatus.textContent = err.message; btnDemo.disabled = false; }
    });
  }
})();
