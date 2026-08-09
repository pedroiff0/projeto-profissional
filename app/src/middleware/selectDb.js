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
      // No banco demo o usuario pode fazer o que quiser nos dados de dominio
      // (projetos, catalogo), mas continua sem poder alterar USUARIOS — isso
      // e garantido em outro lugar (papel nao-admin + guards de rota). Aqui
      // soliberamos o escopo de dono dos registros de dominio.
      req.demoBypass = m === 'demo';
      // Locais para as views/navbar: caminho atual e prefixo de modo, para que
      // a navegacao aponte para a instancia certa (/app, /test ou /demo).
      const base = m === 'app' ? '' : `/${m}`;
      res.locals.currentPath = (req.baseUrl || '') + (req.path || '/');
      res.locals.modo = m;
      res.locals.base = base;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { selectDb };
