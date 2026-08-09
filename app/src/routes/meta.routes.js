const express = require('express');
const metaController = require('../controllers/meta.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', metaController.obter);
router.patch('/', metaController.salvar);
router.post('/foco', metaController.registrarFoco);

module.exports = router;
