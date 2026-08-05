const express = require('express');
const {
  pageAuth,
  optionalPageAuth,
  requirePageRole,
  requirePasswordChanged,
} = require('../middleware/pageAuth');
const { HTTP_CATALOG } = require('../routes/status.routes');

const router = express.Router();

router.get('/login', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/');
  res.render('login');
});

router.get('/forgot-password', (req, res) => res.render('forgot-password'));

router.get('/reset-password', (req, res) =>
  res.render('reset-password', { token: String(req.query.token || '') })
);

router.get('/primeiro-acesso', pageAuth, (req, res) =>
  res.render('primeiro-acesso', { user: req.user })
);

// Dashboard (montado sob /app, /test e /demo -> a rota interna e '/')
router.get('/', pageAuth, requirePasswordChanged, (req, res) => {
  const modo = (req.baseUrl || '').replace('/', '') || 'app';
  res.render('dashboard', {
    user: req.user,
    pageScript: 'dashboard',
    modo,
    demoApi: `/api/${modo}/demo/load`,
    mostraDemo: modo !== 'production',
  });
});

router.get('/perfil', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('perfil', { user: req.user })
);

router.get('/projetos', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('projetos', { user: req.user, pageScript: 'projetos' })
);

router.get('/catalogo', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('catalogo', { user: req.user, pageScript: 'catalogo' })
);

router.get('/admin', pageAuth, requirePasswordChanged, requirePageRole('admin'), (req, res) =>
  res.render('admin/usuarios', { user: req.user })
);

router.get('/status', (req, res) => {
  const query = String(req.query.q || '').trim();
  const rows = Object.entries(HTTP_CATALOG)
    .map(([code, meta]) => ({ code: Number(code), ...meta }))
    .filter((r) => {
      if (!query) return true;
      const hay = `${r.code} ${r.name} ${r.desc}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .sort((a, b) => a.code - b.code);
  res.render('status', { rows, query });
});

module.exports = router;
