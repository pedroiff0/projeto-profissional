// Painel: graficos SVG (barras horizontais, donut de dificuldade, foco semanal),
// meta semanal, pomodoro e relatorio de horas por projeto/tarefa. Sem inline (CSP).
(function () {
  const apiBase = (document.querySelector('#chart') || document.body).dataset.apiBase
    || (window.location.pathname.startsWith('/demo') ? '/demo/api' : '/api');
  const COLORS = { planejado: '#94a3b8', em_andamento: '#2563eb', pausado: '#f59e0b', concluido: '#16a34a' };
  const STATUS_LABEL = { planejado: 'A fazer', em_andamento: 'Andamento', pausado: 'Pausado', concluido: 'Concluído' };

  async function apiRequest(url, opts) {
    const res = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function el(id) { return document.getElementById(id); }

  // Barras horizontais (recria o grafico de status de forma legivel).
  function drawBarsH(container, items, colorFn, valueSuffix) {
    if (!items.length) { container.innerHTML = '<p class="muted">Sem dados.</p>'; return; }
    const max = Math.max.apply(null, items.map((i) => i.value)) || 1;
    container.innerHTML = items.map((it) => {
      const pct = Math.max(2, Math.round((it.value / max) * 100));
      const cor = colorFn(it);
      return '<div class="hbar-row"><span class="hbar-label">' + escapeHtml(it.label) + '</span>'
        + '<span class="hbar-track"><span class="hbar-fill" style="width:' + pct + '%;background:' + cor + '"></span></span>'
        + '<span class="hbar-val">' + escapeHtml(String(it.value)) + (valueSuffix || '') + '</span></div>';
    }).join('');
  }

  // Donut generico (usado para dificuldade).
  function drawDonut(container, legendEl, items, colors) {
    const total = items.reduce((a, b) => a + b.value, 0);
    if (!total) { container.innerHTML = '<p class="muted">Sem dados.</p>'; legendEl.textContent = ''; return; }
    const R = 60, C = 2 * Math.PI * R; let off = 0;
    const segs = items.map((it, i) => {
      const frac = it.value / total;
      const dash = (frac * C).toFixed(2);
      const seg = '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="' + (colors[i] || '#94a3b8')
        + '" stroke-width="22" stroke-dasharray="' + dash + ' ' + (C - dash) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 80 80)"></circle>';
      off += dash; return seg;
    }).join('');
    container.innerHTML = '<svg viewBox="0 0 160 160" width="160" height="160">'
      + '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="var(--border)" stroke-width="22"></circle>' + segs
      + '<text x="80" y="76" text-anchor="middle" class="donut-num">' + total + '</text>'
      + '<text x="80" y="94" text-anchor="middle" class="donut-sub">total</text></svg>';
    legendEl.innerHTML = items.map((it, i) =>
      '<span class="legend-item"><span class="legend-dot" style="background:' + (colors[i] || '#94a3b8') + '"></span>'
      + escapeHtml(it.label) + ' · ' + it.value + '</span>').join('');
  }

  // Linha/area de foco semanal.
  function drawWeek(container, data) {
    if (!data || !data.length) { container.innerHTML = '<p class="muted">Sem dados.</p>'; return; }
    const W = 520, H = 180, pad = 28, max = Math.max.apply(null, data) || 1;
    const step = (W - pad * 2) / (data.length - 1 || 1);
    const pts = data.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
    const line = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const area = 'M' + pts[0][0].toFixed(1) + ',' + (H - pad) + ' L' + line.split(' ').join(' L') + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + (H - pad) + ' Z';
    const dots = pts.map((p, i) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" class="wk-dot"></circle>'
      + '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 8).toFixed(1) + '" text-anchor="middle" class="wk-lbl">' + data[i] + '</text>'
      + '<text x="' + p[0].toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="wk-x">' + ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i] + '</text>').join('');
    container.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet">'
      + '<path d="' + area + '" class="wk-area"></path><polyline points="' + line + '" class="wk-line"></polyline>'
      + dots + '</svg>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function topProjectsByFocus(tasks, limit) {
    const map = {};
    tasks.forEach((t) => {
      const k = t.projetoId || 'sem';
      if (!map[k]) map[k] = { id: k, nome: t.projetoNome || 'Sem projeto', min: 0, n: 0 };
      map[k].min += (t.minutosFoco || 0); map[k].n += 1;
    });
    return Object.values(map).sort((a, b) => b.min - a.min).slice(0, limit || 8);
  }

  function diffDistribution(tasks) {
    const fib = [1, 2, 3, 5, 8, 13, 21];
    const counts = {}; fib.forEach((f) => (counts[f] = 0));
    tasks.forEach((t) => { if (t.dificuldade && counts[t.dificuldade] !== undefined) counts[t.dificuldade] += 1; });
    return fib.map((f) => ({ label: String(f), value: counts[f] }));
  }

  function renderHoursTable(tasks) {
    const rows = topProjectsByFocus(tasks, 12);
    const body = el('hours-body');
    if (!body) return;
    body.innerHTML = rows.map((r) =>
      '<tr><td>' + escapeHtml(r.nome) + '</td><td>' + r.n + '</td><td>' + r.min + '</td><td>' + (r.min / 60).toFixed(1) + 'h</td></tr>'
    ).join('') || '<tr><td colspan="4" class="muted">Sem dados.</td></tr>';
  }

  async function init() {
    try {
      const [tasksRes, metaRes] = await Promise.all([
        apiRequest(apiBase + '/tasks?limit=2000'),
        apiRequest(apiBase + '/meta').catch(() => ({ meta: {} })),
      ]);
      const tasks = (tasksRes && tasksRes.items) || [];
      const meta = (metaRes && metaRes.meta) || {};

      // Status (barras horizontais reescritas).
      const byStatus = {};
      tasks.forEach((t) => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
      const statusItems = Object.keys(STATUS_LABEL).map((k) => ({ label: STATUS_LABEL[k], value: byStatus[k] || 0, key: k }));
      drawBarsH(el('bars-status'), statusItems, (it) => COLORS[it.key] || '#94a3b8');
      el('bars-status-legend').textContent = tasks.length + ' tarefas no total';

      // Foco semanal (meta).
      const focoPorDia = (meta.focoPorDia && meta.focoPorDia.length === 7) ? meta.focoPorDia : [0, 0, 0, 0, 0, 0, 0];
      drawWeek(el('week-chart'), focoPorDia);

      // Horas por projeto (top 8).
      const proj = topProjectsByFocus(tasks, 8);
      drawBarsH(el('bars-project'), proj.map((p) => ({ label: p.nome, value: p.min })), () => 'var(--primary)', ' min');
      el('bars-project-legend').textContent = 'Minutos de foco registrados por projeto (Pomodoro vinculado)';

      // Distribuicao de dificuldade (donut).
      const diff = diffDistribution(tasks);
      const diffColors = ['#16a34a', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#b91c1c'];
      drawDonut(el('donut-diff'), el('donut-diff-legend'), diff, diffColors);

      // Tabela de horas.
      renderHoursTable(tasks);
    } catch (e) {
      document.querySelectorAll('.bars, .donut, .week-chart').forEach((c) => { c.innerHTML = '<p class="muted">Erro ao carregar dados.</p>'; });
    }
    setupPomodoro();
  }

  // Pomodoro do painel (foco global do dono).
  let pomoTimer = null;
  function setupPomodoro() {
    const clock = el('pomo-clock'); const start = el('pomo-start'); const stop = el('pomo-stop'); const msg = el('pomo-msg');
    if (!clock || !start) return;
    start.addEventListener('click', () => {
      if (pomoTimer) return;
      let restante = 25 * 60;
      const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      clock.textContent = fmt(restante); start.disabled = true;
      pomoTimer = setInterval(() => {
        restante -= 1; clock.textContent = fmt(restante);
        if (restante <= 0) {
          clearInterval(pomoTimer); pomoTimer = null; start.disabled = false; clock.textContent = '25:00';
          msg.textContent = 'Registrando…';
          apiRequest(apiBase + '/meta/foco', { method: 'POST', body: JSON.stringify({ minutos: 25 }) })
            .then(() => { msg.textContent = 'Pomodoro concluído! +25 min de foco.'; })
            .catch(() => { msg.textContent = 'Erro ao registrar foco.'; });
        }
      }, 1000);
    });
    if (stop) stop.addEventListener('click', () => {
      if (pomoTimer) { clearInterval(pomoTimer); pomoTimer = null; start.disabled = false; clock.textContent = '25:00'; msg.textContent = ''; }
    });
    // Meta semanal.
    const gf = el('goal-form');
    if (gf) gf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = Number(gf.metaSemana.value) || 0;
      try { await apiRequest(apiBase + '/meta', { method: 'PATCH', body: JSON.stringify({ metaSemana: v }) }); el('goal-status').textContent = 'Meta salva.'; }
      catch (_) { el('goal-status').textContent = 'Erro ao salvar meta.'; }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
