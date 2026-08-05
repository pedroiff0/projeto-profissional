const express = require('express');
const projectController = require('../controllers/project.controller');
const { auth } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { projectCreate, projectUpdate } = require('../schemas/demo.schemas');

const router = express.Router();

router.use(auth);

router.get('/', projectController.listar);
router.get('/:id', projectController.obter);
router.post('/', validate(projectCreate), projectController.criar);
router.patch('/:id', validate(projectUpdate), projectController.atualizar);
router.delete('/:id', projectController.remover);

module.exports = router;
