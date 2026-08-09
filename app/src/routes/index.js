const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/status', require('./status.routes'));
router.use('/projects', require('./project.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/professionals', require('./professional.routes'));
router.use('/catalog', require('./catalog.routes'));
router.use('/meta', require('./meta.routes'));
router.use('/demo', require('./demo.routes'));

// Novos dominios entram aqui: router.use('/pedidos', require('./pedidos.routes'));

module.exports = router;
