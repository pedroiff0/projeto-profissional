const { createApp } = require('./app');
const { connectDb, disconnectDb, getModeConn } = require('./config/db');
const { getModels } = require('./models/registry');
const { seedAdminIfEmpty } = require('./seeds/admin.seed');
const { carregarDemo } = require('./services/demoService');
const env = require('./config/env');

async function seedBanco(mode, { populaDemo = false, demo = false, skipAutoUser = false } = {}) {
  const conn = getModeConn(mode);
  const models = getModels(conn);
  const seed = await seedAdminIfEmpty({ populaDemo: false }, models);
  if (demo) {
    await carregarDemo({ usuarios: 30, projetos: 40, itens: 120 }, models);
  } else if (populaDemo) {
    await carregarDemo({ usuarios: 4, projetos: 6, itens: 10, skipAutoUser }, models);
  }
  return seed;
}

async function main() {
  try {
    await connectDb();
    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Falha ao conectar ao MongoDB:', err.message);
    process.exit(1);
  }

  // Instancia UNICA: semeia os 3 bancos sempre (rodam simultaneos).
  //   app_db      (producao)   -> so o admin
  //   app_test_db (teste)      -> admin + usuarios demo
  //   app_demo_db (demo)       -> banco completo, acessado via rotas demo/*
  const seeds = {};
  seeds.production = await seedBanco('production');
  seeds.test = await seedBanco('test', { populaDemo: true, skipAutoUser: true });
  seeds.demo = await seedBanco('demo', { demo: true });

  const criados = Object.values(seeds).filter((s) => s && s.created);
  if (criados.length) {
    console.log('============================================================');
    criados.forEach((s) => {
      console.log(`Conta admin criada (${s.mode || 'producao'}): ${s.email} / ${s.password}`);
      if (s.doArquivo) console.log('  (senha lida de SEED_PASSWORD_FILE — comum a outros projetos)');
    });
    console.log('Bancos: app_db (producao), app_test_db (teste), app_demo_db (demo).');
    console.log('============================================================');
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Servidor escutando na porta ${env.port} (instancia unica, 3 bancos)`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} recebido — encerrando...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) main();

module.exports = { main, createApp };
