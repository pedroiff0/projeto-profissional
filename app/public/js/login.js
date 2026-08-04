document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value,
        }),
      });
      if (data.user.mustChangePassword) window.location.href = '/primeiro-acesso';
      else window.location.href = data.user.role === 'admin' ? '/admin' : '/app';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
    }
  });
});
