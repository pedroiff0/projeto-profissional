const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));

// Novos dominios entram aqui: router.use('/pedidos', require('./pedidos.routes'));

module.exports = router;
