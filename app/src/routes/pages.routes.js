const express = require('express');
const {
  pageAuth,
  optionalPageAuth,
  requirePageRole,
  requirePasswordChanged,
} = require('../middleware/pageAuth');

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

module.exports = router;
