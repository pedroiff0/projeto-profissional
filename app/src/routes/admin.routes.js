const express = require('express');
const adminController = require('../controllers/admin.controller');
const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireRole');
const { validate } = require('../utils/validation');
const s = require('../schemas/admin.schemas');

const router = express.Router();

// Todo o router e admin-only.
router.use(auth, requireAdmin);

router.get('/users', adminController.listarUsuarios);
router.post('/users', validate(s.criarUsuarioSchema), adminController.criarUsuario);
router.patch('/users/:id', validate(s.idParamSchema, 'params'), validate(s.atualizarUsuarioSchema), adminController.atualizarUsuario);
router.post('/users/:id/reset-password', validate(s.idParamSchema, 'params'), adminController.resetarSenha);

module.exports = router;
