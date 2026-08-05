const { createApp } = require('./app');
const { connectDb, disconnectDb, getModeConn, modeFromEnv } = require('./config/db');
const { getModels } = require('./models/registry');
const { seedAdminIfEmpty } = require('./seeds/admin.seed');
const { carregarDemo } = require('./services/demoService');
const env = require('./config/env');

async function seedBanco(mode, { populaDemo = false, demo = false } = {}) {
  const conn = getModeConn(mode);
  const models = getModels(conn);
  const seed = await seedAdminIfEmpty({ populaDemo: false }, models);
  if (demo) {
    await carregarDemo({ usuarios: 30, projetos: 40, itens: 120 }, models);
  } else if (populaDemo) {
    await carregarDemo({ usuarios: 4, projetos: 6, itens: 10 }, models);
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

  // Producao: so o admin. Teste: admin + usuarios demo. Demo: banco completo.
  const mode = modeFromEnv();
  const demoEnv = process.env.POPULA_DEMO;
  const populaTeste = mode !== 'production' && demoEnv !== 'false' && demoEnv !== '0';

  const seed = await seedBanco(mode, {
    populaDemo: populaTeste && mode === 'test',
    demo: mode === 'demo',
  });

  if (seed.created) {
    console.log('============================================================');
    console.log('Conta admin criada (unica vez — guarde esta senha agora):');
    console.log(`  E-mail: ${seed.email}`);
    console.log(`  Senha:  ${seed.password}`);
    if (seed.doArquivo) console.log('  (senha lida de SEED_PASSWORD_FILE — comum a outros projetos)');
    console.log(`  Banco:  ${mode}`);
    if (mode === 'demo') console.log('  Banco DEMO populado (projetos + catalogo + usuarios).');
    if (mode === 'test') console.log('  Banco de TESTE populado com usuarios demo.');
    console.log('============================================================');
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Servidor escutando na porta ${env.port} (${mode})`);
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
