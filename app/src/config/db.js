const mongoose = require('mongoose');
const env = require('./env');

// Três bancos FÍSICOS (databases) na mesma instância Mongo:
//   - production -> app_db   (só o dono insere dados)
//   - test       -> app_test_db (você e o assistente brincam)
//   - demo       -> app_demo_db (populado; botão na landing autologa)
// Usamos connection.useDb() para reaproveitar o pool de conexões e registrar
// os models em cada database de forma isolada.
const MODE_DB = {
  production: 'app_db',
  test: 'app_test_db',
  demo: 'app_demo_db',
};

let mainConn = null;
const modeConns = {}; // cache por modo

function baseUri() {
  // MONGO_URI pode vir com ou sem nome de database; usamos só a raiz.
  const uri = env.mongoUri || 'mongodb://localhost:27017';
  const semDb = uri.replace(/\/[^/?]+(\?|$)/, '/$1');
  return semDb;
}

async function connectDb() {
  mongoose.set('strictQuery', true);
  mainConn = await mongoose.createConnection(baseUri(), {
    autoIndex: env.nodeEnv !== 'production',
  });
  await mainConn.asPromise();
  return mainConn;
}

function getModeConn(mode) {
  if (!mainConn) throw new Error('Banco não conectado');
  if (!MODE_DB[mode]) throw new Error(`Modo de banco inválido: ${mode}`);
  if (!modeConns[mode]) {
    modeConns[mode] = mainConn.useDb(MODE_DB[mode], { useCache: true });
  }
  return modeConns[mode];
}

function modeFromEnv() {
  if (env.nodeEnv === 'production' || env.nodeEnv === 'development') return 'production';
  if (env.nodeEnv === 'test' || env.nodeEnv === 'staging') return 'test';
  if (env.nodeEnv === 'demo') return 'demo';
  return 'production';
}

async function disconnectDb() {
  await mongoose.disconnect();
  mainConn = null;
  for (const k of Object.keys(modeConns)) delete modeConns[k];
}

module.exports = { connectDb, disconnectDb, getModeConn, modeFromEnv, MODE_DB };
