// Models das connections de producao e teste para uso nos testes.
// Usamos getters para resolver a connection DE MANEIRA LAZY: o require
// deste helper ocorre antes de setupDb() conectar o banco, mas o acesso
// a `.prod`/`.test` so acontece dentro dos testes (apos a conexao).
const { getModeConn } = require('../../src/config/db');
const { getModels } = require('../../src/models/registry');

module.exports = {
  get prod() { return getModels(getModeConn('production')); },
  get test() { return getModels(getModeConn('test')); },
  getModels,
  getModeConn,
};
