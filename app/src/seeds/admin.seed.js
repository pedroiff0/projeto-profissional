const crypto = require('crypto');
const fs = require('fs');
const authService = require('../services/authService');
const env = require('../config/env');
const { getModels } = require('../models/registry');

// Caminho padrao do arquivo de senha compartilhado (fora do repo, no HD do
// dono). Usado quando SEED_PASSWORD_FILE nao foi definido explicitamente.
function caminhoSenhaPadrao() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return home ? `${home}/Documentos/comum/senhas-projetos.md` : '';
}

// Resolve a senha do admin a partir de (em ordem de prioridade):
//   1. ADMIN_PASSWORD no .env (explícito, raramente usado em dev)
//   2. SEED_PASSWORD_FILE  -> arquivo local fora do repo (ex.: ~/Documentos/comum)
//      Se nao definido, usa o caminho padrao acima (se existir).
//   3. senha aleatória gerada no boot (caso de produção sem seed)
function resolverSenhaAdmin() {
  // Lido em runtime (process.env) para refletir mudancas sem reiniciar.
  const adminPassword = process.env.ADMIN_PASSWORD || env.adminPassword;
  if (adminPassword) return { senha: adminPassword, doArquivo: false };
  const arquivo = process.env.SEED_PASSWORD_FILE || caminhoSenhaPadrao();
  if (arquivo && fs.existsSync(arquivo)) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    const match = texto.match(/Senha:\s*`?["']?(.+?)["'`]?\s*$/im)
      || texto.split('\n').find((l) => l.trim());
    const senha = (match && match[1] ? match[1] : match || '')
      .replace(/[`"']/g, '')
      .trim();
    if (senha) return { senha, doArquivo: true };
  }
  return { senha: crypto.randomBytes(18).toString('base64url'), doArquivo: false };
}

// Cria o admin inicial APENAS se nao houver nenhum admin no banco do modo.
// 'populaDemo' controla se acompanha usuarios sinteticos (so no banco de teste).
async function seedAdminIfEmpty({ populaDemo = false } = {}, models) {
  const Models = models || getModels(require('../config/db').getModeConn('production'));
  const User = Models.User;
  const existing = await User.findOne({ role: 'admin' });
  if (existing) return { created: false };

  const { senha, doArquivo } = resolverSenhaResult();
  const passwordHash = await authService.hashPassword(senha);

  await User.create({
    role: 'admin',
    name: env.adminName,
    email: env.adminEmail,
    passwordHash,
    mustChangePassword: Boolean(env.adminPassword || doArquivo),
  });

  if (populaDemo) await seedUsuariosDemo(passwordHash, Models);

  return { created: true, email: env.adminEmail, password: senha, doArquivo };
}

async function seedUsuariosDemo(passwordHash, Models) {
  const User = Models.User;
  const perfis = [
    { name: 'Ana Oliveira', email: 'ana@example.com', role: 'user' },
    { name: 'Bruno Santos', email: 'bruno@example.com', role: 'user' },
    { name: 'Carla Lima', email: 'carla@example.com', role: 'admin' },
    { name: 'Diego Souza', email: 'diego@example.com', role: 'user' },
  ];
  await User.insertMany(
    perfis.map((p) => ({
      ...p,
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      tokenValidAfter: new Date(Date.now() - 60_000),
    }))
  );
  return perfis.length;
}

// Helper interno para nao duplicar a chamada ao resolverSenhaAdmin.
function resolverSenhaResult() {
  return resolverSenhaAdmin();
}

module.exports = { seedAdminIfEmpty, seedUsuariosDemo, resolverSenhaAdmin };
