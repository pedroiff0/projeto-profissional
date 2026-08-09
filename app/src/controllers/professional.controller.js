const { asyncHandler } = require('../utils/validation');
const professionalService = require('../services/professionalService');

const listar = asyncHandler(async (req, res) => {
  const resultado = await professionalService.listar(
    { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 },
    req.models,
  );
  res.json(resultado);
});

const obter = asyncHandler(async (req, res) =>
  res.json({ professional: await professionalService.obter(req.params.id, req.user.id, req.user.role, req.models, req.demoBypass) }));

const criar = asyncHandler(async (req, res) => {
  const p = await professionalService.criar(req.body, req.user.id, req.user.name, req.models);
  res.status(201).json({ professional: p });
});

const atualizar = asyncHandler(async (req, res) =>
  res.json({ professional: await professionalService.atualizar(req.params.id, req.body, req.user.id, req.user.role, req.models, req.demoBypass) }));

const remover = asyncHandler(async (req, res) => {
  await professionalService.remover(req.params.id, req.user.id, req.user.role, req.models, req.demoBypass);
  res.status(204).end();
});

module.exports = { listar, obter, criar, atualizar, remover };
