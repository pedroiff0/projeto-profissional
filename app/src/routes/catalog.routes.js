const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const { auth } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { catalogItemCreate, catalogItemUpdate } = require('../schemas/demo.schemas');

const router = express.Router();

router.use(auth);

router.get('/', catalogController.listar);
router.get('/:id', catalogController.obter);
router.post('/', validate(catalogItemCreate), catalogController.criar);
router.patch('/:id', validate(catalogItemUpdate), catalogController.atualizar);
router.delete('/:id', catalogController.remover);

module.exports = router;
