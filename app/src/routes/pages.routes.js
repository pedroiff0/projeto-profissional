const express = require('express');
const {
  pageAuth,
  optionalPageAuth,
  requirePageRole,
  requirePasswordChanged,
} = require('../middleware/pageAuth');

const { HTTP_CATALOG } = require('../routes/status.routes');
const router = express.Router();

router.get('/', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/app');
  res.render('landing');
});

router.get('/login', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/app');
  res.render('login');
});

router.get('/forgot-password', (req, res) => res.render('forgot-password'));

router.get('/reset-password', (req, res) =>
  res.render('reset-password', { token: String(req.query.token || '') })
);

// Fora do guard requirePasswordChanged de proposito (senao redirecionaria
// para si mesma).
router.get('/primeiro-acesso', pageAuth, (req, res) =>
  res.render('primeiro-acesso', { user: req.user })
);

router.get('/app', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('dashboard', { user: req.user })
);

router.get('/perfil', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('perfil', { user: req.user })
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
