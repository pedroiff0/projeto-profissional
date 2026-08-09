const { asyncHandler } = require('../utils/validation');
const metaService = require('../services/metaService');

const obter = asyncHandler(async (req, res) =>
  res.json({ meta: await metaService.obter(req.user.id, req.models) }));

const salvar = asyncHandler(async (req, res) => {
  const m = await metaService.salvar(req.user.id, req.body, req.models);
  res.json({ meta: m });
});

const registrarFoco = asyncHandler(async (req, res) => {
  const m = await metaService.registrarFoco(req.user.id, (req.body && req.body.minutos) || 25, req.models);
  res.json({ meta: m });
});

module.exports = { obter, salvar, registrarFoco };
