document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-forgot');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBoxes();
    try {
      const data = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: document.getElementById('email').value.trim() }),
      });
      showOk(data.message);
    } catch (err) {
      showError(err.message);
    }
  });
});
