const User = require('../models/user.model');
const Project = require('../models/project.model');
const CatalogItem = require('../models/catalogItem.model');
const authService = require('../services/authService');

const NOMES = [
  'Ana Oliveira', 'Bruno Santos', 'Carla Lima', 'Diego Souza', 'Elena Costa',
  'Felipe Almeida', 'Gabriela Rocha', 'Henrique Dias', 'Isabela Martins',
  'João Pereira', 'Karen Nunes', 'Lucas Ferreira', 'Marina Silva', 'Nuno Carvalho',
  'Olívia Borges', 'Pedro Rocha', 'Quésia Alves', 'Rafael Gomes', 'Sofia Mendes',
  'Thiago Barbosa', 'Úrsula Pinto', 'Vitor Hugo', 'Wagner Castro', 'Yara Ribeiro',
  'Zeca Monteiro', 'Beatriz Lopes', 'César Ramos', 'Débora Vieira', 'Eduardo Tavares',
  'Fernanda Cardoso', 'Gustavo Teixeira', 'Helena Moraes', 'Igor Nogueira',
];
const CATEGORIAS = ['Escritório', 'TI', 'Limpeza', 'Mobiliário', 'Papelaria', 'Industrial'];
const STATUS = ['planejado', 'em_andamento', 'concluido', 'pausado'];
const TAGS = ['urgente', 'interno', 'cliente', 'poc', 'melhoria', 'bug', 'feature'];

function hashSenhaComum() {
  // Senha compartilhada dos usuarios demo (mesma do admin, vem do arquivo).
  // Usamos um hash fixo calculado uma vez por processo.
  if (!hashSenhaComum._cache) {
    // eslint-disable-next-line global-require
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    let senha = 'AdminComum123!!';
    const arq = process.env.SEED_PASSWORD_FILE;
    if (arq && fs.existsSync(arq)) {
      const txt = fs.readFileSync(arq, 'utf8');
      const m = txt.match(/Senha:\s*`?["']?(.+?)["'`]?\s*$/im);
      if (m) senha = m[1].replace(/[`"']/g, '').trim();
    }
    hashSenhaComum._cache = senha;
  }
  return hashSenhaComum._cache;
}

async function popularUsuarios(qtd) {
  const senha = hashSenhaComum();
  const hash = await authService.hashPassword(senha);
  const ops = [];
  for (let i = 0; i < qtd; i += 1) {
    const nome = NOMES[i % NOMES.length];
    const seq = Math.floor(i / NOMES.length);
    const email = `demo${i + 1}@example.com`;
    ops.push({
      updateOne: {
        filter: { email },
        update: {
          $set: {
            name: seq ? `${nome} ${seq + 1}` : nome,
            email,
            role: i % 7 === 0 ? 'admin' : 'user',
            passwordHash: hash,
            isActive: true,
            mustChangePassword: false,
            tokenValidAfter: new Date(Date.now() - 60_000),
          },
        },
        upsert: true,
      },
    });
  }
  await User.bulkWrite(ops);
  return qtd;
}

async function popularProjetos(qtd, owners) {
  const nomes = ['Migração', 'Refatoração', 'Onboarding', 'Dashboard', 'API', 'App', 'Pipeline',
    'Relatório', 'Integração', 'Backup', 'Cache', 'Auditoria', 'Mobile', 'Web', 'Docs'];
  const ops = [];
  for (let i = 0; i < qtd; i += 1) {
    const owner = owners[i % owners.length];
    const status = STATUS[i % STATUS.length];
    const tags = [TAGS[i % TAGS.length], TAGS[(i + 3) % TAGS.length]];
    ops.push({
      name: `${nomes[i % nomes.length]} #${i + 1}`,
      description: `Projeto de demonstração ${i + 1} — exercita listagem, filtro e detalhe.`,
      status,
      tags: [...new Set(tags)],
      ownerId: owner._id,
      ownerName: owner.name,
    });
  }
  await Project.insertMany(ops);
  return qtd;
}

async function popularCatalogo(qtd) {
  const ops = [];
  for (let i = 0; i < qtd; i += 1) {
    const cat = CATEGORIAS[i % CATEGORIAS.length];
    ops.push({
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      name: `Item de catálogo ${i + 1}`,
      category: cat,
      price: Number((10 + (i * 7.5) % 990).toFixed(2)),
      stock: (i * 13) % 500,
      active: i % 9 !== 0,
    });
  }
  await CatalogItem.insertMany(ops);
  return qtd;
}

// Carrega o conjunto completo de demonstração, se ainda não existir.
// 'force' recria do zero (apaga coleções demo antes).
async function carregarDemo({ projetos = 40, itens = 120, usuarios = 30, force = false } = {}) {
  if (force) {
    await Project.deleteMany({});
    await CatalogItem.deleteMany({});
    await User.deleteMany({ email: /@example\.com$/ });
  } else {
    const jaTem = await CatalogItem.countDocuments({});
    if (jaTem > 0) return { carregado: false, motivo: 'ja_existe' };
  }

  const nU = await popularUsuarios(usuarios);
  const owners = await User.find({ email: /@example\.com$/ }).limit(usuarios);
  const nP = await popularProjetos(projetos, owners);
  const nI = await popularCatalogo(itens);
  return { carregado: true, usuarios: nU, projetos: nP, itens: nI };
}

module.exports = { carregarDemo, popularUsuarios, popularProjetos, popularCatalogo };
