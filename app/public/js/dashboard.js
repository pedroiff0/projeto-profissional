// Botao de demonstracao: carrega (ou recarrega) o banco de demo via API.
// O backend bloqueia em producao; aqui tambem escondemos o botao por CSS/env.
(function () {
  const btn = document.getElementById('btn-demo');
  const btnForce = document.getElementById('btn-demo-force');
  const status = document.getElementById('demo-status');
  if (!btn) return;

  async function carregar(force) {
    btn.disabled = true;
    if (btnForce) btnForce.disabled = true;
    status.textContent = 'Carregando dados de demonstração…';
    try {
      const res = await fetch('/api/demo/load' + (force ? '?force=true' : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = 'Falha: ' + (data.error || res.status);
        return;
      }
      if (data.carregado === false) {
        status.textContent = 'Dados de demonstração já estão carregados. Use "Recarregar do zero" para refazer.';
      } else {
        status.textContent =
          `Carregado: ${data.usuarios} usuários, ${data.projetos} projetos, ${data.itens} itens de catálogo. ` +
          `Acesse /projetos e /catalogo.`;
      }
    } catch (err) {
      status.textContent = 'Erro de rede ao carregar demonstração.';
    } finally {
      btn.disabled = false;
      if (btnForce) btnForce.disabled = false;
    }
  }

  btn.addEventListener('click', () => carregar(false));
  if (btnForce) btnForce.addEventListener('click', () => carregar(true));
})();
