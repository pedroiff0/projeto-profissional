document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  if (!form) return;

  // Mostrar/ocultar senha.
  const toggle = document.getElementById('toggle-password');
  const password = document.getElementById('password');
  if (toggle && password) {
    toggle.addEventListener('click', () => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      toggle.querySelector('.eye-open').style.display = show ? 'none' : '';
      toggle.querySelector('.eye-off').style.display = show ? '' : 'none';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const data = await apiRequest(form.getAttribute('action'), {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          password: password.value,
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
