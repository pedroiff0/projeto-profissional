const express = require('express');
const professionalController = require('../controllers/professional.controller');
const { auth } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { professionalCreate, professionalUpdate } = require('../schemas/demo.schemas');

const router = express.Router();
router.use(auth);
router.get('/', professionalController.listar);
router.get('/:id', professionalController.obter);
router.post('/', validate(professionalCreate), professionalController.criar);
router.patch('/:id', validate(professionalUpdate), professionalController.atualizar);
router.delete('/:id', professionalController.remover);

module.exports = router;
