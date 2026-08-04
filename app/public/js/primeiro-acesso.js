document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-primeiro-acesso');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    try {
      const data = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: document.getElementById('newPassword').value }),
      });
      window.location.href = data.user.role === 'admin' ? '/admin' : '/app';
    } catch (err) {
      showError(err.message);
    }
  });
});
