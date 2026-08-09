const express = require('express');
const { optionalPageAuth } = require('../middleware/pageAuth');
const { landingFor } = require('../config/landingContent');

const router = express.Router();

// Landing unica da INSTANCIA. Fala sobre o que o sistema faz e oferece a demo.
// O idioma vem de res.locals.lang (middleware i18n).
router.get('/', optionalPageAuth, (req, res) => {
  if (req.user) {
    const modo = (req.baseUrl || '').replace('/', '') || 'app';
    if (modo === 'demo') return res.redirect('/demo');
    if (modo === 'test') return res.redirect('/test');
    return res.redirect(req.user.role === 'admin' ? '/admin' : '/app');
  }
  const lang = res.locals.lang || 'pt';
  const themeCookie = (req.headers.cookie || '').match(/(?:^|;\s*)theme=([^;]+)/);
  const theme = themeCookie ? themeCookie[1] : 'auto';
  const lpDark = theme === 'dark';
  res.render('landing', {
    lang,
    lp: true,
    lpDark,
    themeToggle: true,
    description: landingFor('production', lang).lede,
  });
});

module.exports = router;
