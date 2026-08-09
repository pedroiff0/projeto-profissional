const { asyncHandler } = require('../utils/validation');
const projectService = require('../services/projectService');

const listar = asyncHandler(async (req, res) => {
  const { status, tag, page } = req.query;
  const filtro = {};
  if (status) filtro.status = status;
  if (tag) filtro.tags = tag;
  const resultado = await projectService.listar({
    userId: req.user.id, role: req.user.role, filtro,
    page: Number(page) || 1, limit: 20, demoBypass: req.demoBypass,
  }, req.models);
  res.json(resultado);
});

const obter = asyncHandler(async (req, res) => {
  const p = await projectService.obter(req.params.id, req.user.id, req.user.role, req.models, req.demoBypass);
  res.json({ project: p });
});

const criar = asyncHandler(async (req, res) => {
  const p = await projectService.criar(req.body, req.user.id, req.user.name, req.models);
  res.status(201).json({ project: p });
});

const atualizar = asyncHandler(async (req, res) => {
  const p = await projectService.atualizar(req.params.id, req.body, req.user.id, req.user.role, req.models, req.demoBypass);
  res.json({ project: p });
});

const remover = asyncHandler(async (req, res) => {
  await projectService.remover(req.params.id, req.user.id, req.user.role, req.models, req.demoBypass);
  res.status(204).end();
});

module.exports = { listar, obter, criar, atualizar, remover };
