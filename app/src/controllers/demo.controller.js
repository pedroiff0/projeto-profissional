const { asyncHandler } = require('../utils/validation');
const demoService = require('../services/demoService');

// Carrega (ou recarrega) o conjunto completo de demonstração.
// So disponivel fora de producao (NODE_ENV != production). O guard extra
// impede uso acidental em producao mesmo se a rota for montada.
const carregar = asyncHandler(async (req, res) => {
  if (req.app.get('env') === 'production') {
    throw new (require('../utils/AppError'))('Recurso de demonstração indisponível em produção', 403);
  }
  const force = req.query.force === 'true' || req.body.force === true;
  const resultado = await demoService.carregarDemo({ force });
  res.json(resultado);
});

module.exports = { carregar };
