const express = require('express');
const demoController = require('../controllers/demo.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Disponivel fora de producao: o controller tambem bloqueia em producao.
router.use(auth);
router.post('/load', demoController.carregar);

module.exports = router;
