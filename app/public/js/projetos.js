// Lista de projetos com filtro (status/tag) e paginacao, consumindo /api/projects.
(function () {
  const list = document.getElementById('proj-list');
  const count = document.getElementById('proj-count');
  const pager = document.getElementById('proj-pager');
  if (!list) return;

  const STATUS_LABEL = {
    planejado: 'Planejado', em_andamento: 'Em andamento',
    concluido: 'Concluído', pausado: 'Pausado',
  };

  function params(page) {
    const url = new URL(window.location.href);
    if (page) url.searchParams.set('page', page);
    return url.searchParams.toString();
  }

  async function carregar(page) {
    const qs = params(page);
    const res = await fetch('/api/projects?' + qs, { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) { count.textContent = 'Erro ao carregar.'; return; }
    count.textContent = `${data.total} projeto(s) · página ${data.page}/${data.pages}`;
    list.innerHTML = '';
    data.items.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML =
        `<strong>${escapeHtml(p.name)}</strong> ` +
        `<span class="status-badge status-client">${STATUS_LABEL[p.status] || p.status}</span>` +
        `<br><span class="muted small">${escapeHtml(p.description || '')}</span>` +
        (p.tags && p.tags.length ? ` <span class="muted small">#${p.tags.map(escapeHtml).join(' #')}</span>` : '');
      list.appendChild(li);
    });
    pager.innerHTML = '';
    if (data.pages > 1) {
      for (let i = 1; i <= data.pages; i += 1) {
        const a = document.createElement('a');
        a.href = '?page=' + i;
        a.className = 'btn-outline';
        a.textContent = i;
        pager.appendChild(a);
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.querySelector('.status-search')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.search = new URLSearchParams(new FormData(e.target)).toString();
  });
  carregar(new URLSearchParams(window.location.search).get('page') || 1);
})();
