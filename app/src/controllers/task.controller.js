const { asyncHandler } = require('../utils/validation');
const taskService = require('../services/taskService');

const listar = asyncHandler(async (req, res) => {
  const { status, projetoId, profissionalId, page } = req.query;
  const filtro = {};
  if (status) filtro.status = status;
  if (projetoId) filtro.projetoId = projetoId;
  if (profissionalId) filtro.profissionalId = profissionalId;
  const resultado = await taskService.listar(
    { userId: req.user.id, role: req.user.role, filtro, demoBypass: req.demoBypass, page: Number(page) || 1, limit: 500 },
    req.models,
  );
  res.json(resultado);
});

const obter = asyncHandler(async (req, res) =>
  res.json({ task: await taskService.obter(req.params.id, req.user.id, req.user.role, req.models, req.demoBypass) }));

const criar = asyncHandler(async (req, res) => {
  const t = await taskService.criar(req.body, req.user.id, req.user.name, req.models);
  res.status(201).json({ task: t });
});

const atualizar = asyncHandler(async (req, res) =>
  res.json({ task: await taskService.atualizar(req.params.id, req.body, req.user.id, req.user.role, req.models, req.demoBypass) }));

const remover = asyncHandler(async (req, res) => {
  await taskService.remover(req.params.id, req.user.id, req.user.role, req.models, req.demoBypass);
  res.status(204).end();
});

const registrarFoco = asyncHandler(async (req, res) => {
  const r = await taskService.registrarFoco(
    req.params.id, (req.body && req.body.minutos) || 25, req.user.id, req.user.role, req.models, req.demoBypass);
  res.json(r);
});

module.exports = { listar, obter, criar, atualizar, remover, registrarFoco };
