const { asyncHandler } = require('../utils/validation');
const demoService = require('../services/demoService');
const { seedAdminIfEmpty } = require('../seeds/admin.seed');

// Carrega (ou recarrega) o conjunto completo de demonstração. So disponivel
// fora de producao. O seed garante o admin@admin.com antes de popular.
const carregar = asyncHandler(async (req, res) => {
  if (req.mode === 'production') {
    throw new (require('../utils/AppError'))('Recurso de demonstração indisponível em produção', 403);
  }
  await seedAdminIfEmpty({ populaDemo: false }, req.models);
  const force = req.query.force === 'true' || req.body.force === true;
  const resultado = await demoService.carregarDemo({ force }, req.models);
  res.json(resultado);
});

module.exports = { carregar };
