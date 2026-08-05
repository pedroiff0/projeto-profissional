const express = require('express');
const demoController = require('../controllers/demo.controller');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();

// Disponivel fora de producao: o controller tambem bloqueia em producao.
// `auth`/`requireRole` SO na rota /load — NUNCA como middleware global do
// router, senao o mount `router.use('/demo', demo.routes)` (dentro de apiRoutes)
// "rouba" rotas como /api/demo/auth/login (prefixo /demo) e exige token.
router.post('/load', auth, requireRole('admin'), demoController.carregar);

module.exports = router;
