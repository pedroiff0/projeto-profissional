const { LANGS, translate } = require('../config/i18n');

// Resolve o idioma da requisicao: ?lang=xx > cookie 'lang' > 'pt'.
// Valida contra a lista suportada e persiste em cookie (1 ano) para visitas
// futuras. Disponibiliza res.locals.lang e res.locals.t(key) nas views.
function i18n(req, res, next) {
  const fromQuery = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : '';
  const fromCookie = req.cookies && req.cookies.lang;
  const raw = fromQuery || fromCookie || 'pt';
  const lang = LANGS.includes(raw) ? raw : 'pt';

  if (fromQuery && fromQuery !== fromCookie) {
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, sameSite: 'lax', path: '/' });
  }
  res.locals.lang = lang;
  res.locals.t = (key) => translate(lang, key);
  next();
}

module.exports = i18n;
