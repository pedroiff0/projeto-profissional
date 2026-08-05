// Lista de catalogo com busca, filtro de categoria e paginacao, via /api/catalog.
(function () {
  const body = document.getElementById('cat-body');
  const count = document.getElementById('cat-count');
  const pager = document.getElementById('cat-pager');
  if (!body) return;

  function params(page) {
    const url = new URL(window.location.href);
    if (page) url.searchParams.set('page', page);
    return url.searchParams.toString();
  }

  async function carregar(page) {
    const res = await fetch('/api/catalog?' + params(page), { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) { count.textContent = 'Erro ao carregar.'; return; }
    count.textContent = `${data.total} item(ns) · página ${data.page}/${data.pages}`;
    body.innerHTML = '';
    data.items.forEach((it) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td>${escapeHtml(it.sku)}</td><td>${escapeHtml(it.name)}</td>` +
        `<td>${escapeHtml(it.category)}</td><td>R$ ${Number(it.price).toFixed(2)}</td>` +
        `<td>${it.stock}</td>`;
      body.appendChild(tr);
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
