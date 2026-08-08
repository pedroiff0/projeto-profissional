const express = require('express');
const taskController = require('../controllers/task.controller');
const { auth } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { taskCreate, taskUpdate } = require('../schemas/demo.schemas');

const router = express.Router();
router.use(auth);
router.get('/', taskController.listar);
router.post('/:id/foco', taskController.registrarFoco);
router.get('/:id', taskController.obter);
router.post('/', validate(taskCreate), taskController.criar);
router.patch('/:id', validate(taskUpdate), taskController.atualizar);
router.delete('/:id', taskController.remover);

module.exports = router;
