document.addEventListener('DOMContentLoaded', () => {
  const perfil = document.getElementById('form-perfil');
  const senha = document.getElementById('form-senha');

  perfil?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    try {
      await apiRequest('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: document.getElementById('name').value.trim() }),
      });
      showOk('Perfil atualizado.');
    } catch (err) {
      showError(err.message);
    }
  });

  senha?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: document.getElementById('currentPassword').value,
          newPassword: document.getElementById('newPassword').value,
        }),
      });
      showOk('Senha alterada. As outras sessoes foram encerradas.');
      senha.reset();
    } catch (err) {
      showError(err.message);
    }
  });
});
