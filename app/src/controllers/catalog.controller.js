const { asyncHandler } = require('../utils/validation');
const catalogService = require('../services/catalogService');

const listar = asyncHandler(async (req, res) => {
  const { category, active, page, q } = req.query;
  const filtro = {};
  if (category) filtro.category = category;
  if (active === 'true') filtro.active = true;
  if (active === 'false') filtro.active = false;
  if (q) filtro.$text = { $search: q };
  const resultado = await catalogService.listar({
    filtro,
    page: Number(page) || 1,
    limit: 24,
  });
  res.json(resultado);
});

const obter = asyncHandler(async (req, res) => {
  const item = await catalogService.obter(req.params.id);
  res.json({ item });
});

const criar = asyncHandler(async (req, res) => {
  const item = await catalogService.criar(req.body);
  res.status(201).json({ item });
});

const atualizar = asyncHandler(async (req, res) => {
  const item = await catalogService.atualizar(req.params.id, req.body);
  res.json({ item });
});

const remover = asyncHandler(async (req, res) => {
  await catalogService.remover(req.params.id);
  res.status(204).end();
});

module.exports = { listar, obter, criar, atualizar, remover };
