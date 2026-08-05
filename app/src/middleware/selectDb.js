const { getModeConn } = require('../config/db');
const { getModels } = require('../models/registry');

// Define o "modo" (banco) com base no prefixo da rota: /app=production,
// /test=test, /demo=demo. Injeta req.mode, req.conn e req.models para o
// restante da cadeia (auth, services, controllers) usar a connection certa.
// Rotas públicas (landing, auth de primeiro nível) definem o modo via
// parâmetro; para auth de cada prefixo, o prefixo vem em req.baseUrl.
function selectDb(mode) {
  return (req, res, next) => {
    const m = mode || req.dbMode || 'production';
    try {
      req.mode = m;
      req.conn = getModeConn(m);
      req.models = getModels(req.conn);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { selectDb };
