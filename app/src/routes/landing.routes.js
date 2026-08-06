const express = require('express');
const { optionalPageAuth } = require('../middleware/pageAuth');

const router = express.Router();

// Landing publica (profissional, sempre clara). Apos login, vai para o board
// do task manager. O idioma vem de res.locals.lang (middleware i18n).
router.get('/', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect('/board');
  res.render('landing');
});

module.exports = router;
