const fs = require('fs');
const crypto = require('crypto');
const User = require('../models/user.model');
const authService = require('../services/authService');
const env = require('../config/env');

// Resolve a senha do admin a partir de (em ordem de prioridade):
//   1. ADMIN_PASSWORD no .env (explícito, raramente usado em dev)
//   2. SEED_PASSWORD_FILE  -> arquivo local fora do repo (ex.: ~/Documentos/comum)
//   3. senha aleatória gerada no boot (caso de produção sem seed)
// O arquivo de seed é COMPARTILHADO entre projetos no HD do dono — por isso
// NUNCA é versionado. Se existir, a senha do admin@admin.com é a mesma em
// todos os projetos de dev/teste.
function resolverSenhaAdmin() {
  if (env.adminPassword) return { senha: env.adminPassword, doArquivo: false };
  const arquivo = process.env.SEED_PASSWORD_FILE;
  if (arquivo && fs.existsSync(arquivo)) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    // Aceita "Senha: <valor>" (com ou sem crases/aspas) ou a primeira linha
    // nao-vazia. Remove crases/aspas e espacos das pontas.
    const match = texto.match(/Senha:\s*`?["']?(.+?)["'`]?\s*$/im)
      || texto.split('\n').find((l) => l.trim());
    const senha = (match && match[1] ? match[1] : match || '')
      .replace(/[`"']/g, '')
      .trim();
    if (senha) return { senha, doArquivo: true };
  }
  return { senha: crypto.randomBytes(18).toString('base64url'), doArquivo: false };
}

// Cria o admin inicial APENAS se nao houver nenhum admin no banco.
// 'populaDemo' controla se acompanha usuarios sinteticos (só no banco de teste).
async function seedAdminIfEmpty({ populaDemo = false } = {}) {
  const existing = await User.findOne({ role: 'admin' });
  if (existing) return { created: false };

  const { senha, doArquivo } = resolverSenhaAdmin();
  const passwordHash = await authService.hashPassword(senha);

  await User.create({
    role: 'admin',
    name: env.adminName,
    email: env.adminEmail,
    passwordHash,
    // Senha vinda de .env/arquivo de seed deve ser trocada no primeiro acesso.
    mustChangePassword: Boolean(env.adminPassword || doArquivo),
  });

  if (populaDemo) await seedUsuariosDemo(passwordHash);

  return { created: true, email: env.adminEmail, password: senha, doArquivo };
}

// Usuarios sinteticos para o banco de TESTE — nunca em producao.
// Todos compartilham a mesma senha do admin para facilitar o login manual.
async function seedUsuariosDemo(passwordHash) {
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

module.exports = { seedAdminIfEmpty, seedUsuariosDemo, resolverSenhaAdmin };
