const express = require('express');
const demoController = require('../controllers/demo.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Disponivel fora de producao: o controller tambem bloqueia em producao.
// `auth` SO na rota /load — NUNCA como middleware global do router (senao o
// mount `router.use('/demo', demo.routes)` rouba rotas como /api/demo/auth/login).
// No banco demo o usuario pode recarregar a vontade (demoBypass); fora dele,
// exige admin. O controller reforca a proibicao em producao.
router.post('/load', auth, (req, res, next) => {
  if (req.demoBypass || req.user.role === 'admin') return demoController.carregar(req, res, next);
  return next(new (require('../utils/AppError'))('Acesso negado para este papel de usuario', 403));
});

module.exports = router;
