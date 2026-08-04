document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-reset');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: document.getElementById('token').value,
          newPassword: document.getElementById('newPassword').value,
        }),
      });
      showOk('Senha redefinida. Redirecionando para o login...');
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (err) {
      showError(err.message);
    }
  });
});
