const express = require('express');
const { optionalPageAuth } = require('../middleware/pageAuth');
const { landingFor } = require('../config/landingContent');

const router = express.Router();

// Landing unica da INSTANCIA. Tres entradas para os tres bancos, cada uma com
// seu proprio texto (storytelling). A demo autologa direto via /demo/start.
// O idioma vem de res.locals.lang (middleware i18n).
router.get('/', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/app');
  const lang = res.locals.lang || 'pt';
  const bancos = [
    { id: 'production', titulo: landingFor('production', lang).title, desc: landingFor('production', lang).lede, badge: 'app_db', href: '/app/login', cta: landingFor('production', lang).cta, classe: 'env-prod' },
    { id: 'test', titulo: landingFor('test', lang).title, desc: landingFor('test', lang).lede, badge: 'app_test_db', href: '/test/login', cta: landingFor('test', lang).cta, classe: 'env-test' },
    { id: 'demo', titulo: landingFor('demo', lang).title, desc: landingFor('demo', lang).lede, badge: 'app_demo_db', href: '/demo/start', cta: landingFor('demo', lang).cta, classe: 'env-demo' },
  ];
  res.render('landing', { bancos, lang });
});

module.exports = router;
