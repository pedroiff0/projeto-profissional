const { asyncHandler } = require('../utils/validation');
const taskService = require('../services/taskService');

const listar = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filtro = {};
  if (status) filtro.status = status;
  const items = await taskService.listar(
    { userId: req.user.id, role: req.user.role, filtro },
    req.models
  );
  res.json({ tasks: items });
});

const obter = asyncHandler(async (req, res) => {
  const t = await taskService.obter(req.params.id, req.user.id, req.user.role, req.models);
  res.json({ task: t });
});

const criar = asyncHandler(async (req, res) => {
  const t = await taskService.criar(req.body, req.user.id, req.user.name, req.models);
  res.status(201).json({ task: t });
});

const atualizar = asyncHandler(async (req, res) => {
  const t = await taskService.atualizar(req.params.id, req.body, req.user.id, req.user.role, req.models);
  res.json({ task: t });
});

const remover = asyncHandler(async (req, res) => {
  await taskService.remover(req.params.id, req.user.id, req.user.role, req.models);
  res.status(204).end();
});

const registrarFoco = asyncHandler(async (req, res) => {
  const { minutos } = req.body;
  const t = await taskService.registrarFoco(req.params.id, minutos, req.user.id, req.user.role, req.models);
  res.json({ task: t });
});

module.exports = { listar, obter, criar, atualizar, remover, registrarFoco };
