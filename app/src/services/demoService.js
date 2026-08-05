const authService = require('./authService');
const { resolverSenhaAdmin } = require('../seeds/admin.seed');

// Popula o banco de DEMO (ou teste) com um conjunto completo para exploracao.
// Recebe `models` da connection do modo. Nao duplica: se ja houver projetos ou
// itens, retorna { carregado:false }. `force` apaga e repopula.
async function carregarDemo({ usuarios = 30, projetos = 40, itens = 120, force = false } = {}, models) {
  const { User, Project, CatalogItem } = models;
  const { senha, doArquivo } = resolverSenhaAdmin();
  const passwordHash = await authService.hashPassword(senha);

  if (!force) {
    const jaExiste =
      (await Project.countDocuments({})) > 0 || (await CatalogItem.countDocuments({})) > 0;
    if (jaExiste) return { carregado: false, motivo: 'ja_existe' };
  }
  if (force) {
    await Project.deleteMany({});
    await CatalogItem.deleteMany({});
    await User.deleteMany({ email: /@example\.com$/ });
  }

  // Usuarios demo compartilham a senha do admin (facilita login manual).
  const perfis = [];
  for (let i = 1; i <= usuarios; i += 1) {
    perfis.push({
      name: `Demo ${i}`,
      email: `demo${i}@example.com`,
      role: i % 7 === 0 ? 'admin' : 'user',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      tokenValidAfter: new Date(Date.now() - 60_000),
    });
  }
  await User.insertMany(perfis);

  const status = ['planejado', 'em_andamento', 'concluido', 'pausado'];
  const tags = ['urgente', 'cliente', 'interno', 'beta', 'pilotis'];
  const owners = await User.find({}).lean();
  const projDocs = [];
  for (let i = 1; i <= projetos; i += 1) {
    const dono = owners[i % owners.length];
    projDocs.push({
      name: `Projeto Demo ${i}`,
      description: `Descrição de demonstração #${i}.`,
      status: status[i % status.length],
      tags: [tags[i % tags.length], tags[(i + 2) % tags.length]],
      ownerId: dono._id,
      ownerName: dono.name,
    });
  }
  await Project.insertMany(projDocs);

  const categorias = ['Escritório', 'TI', 'Limpeza', 'Mobiliário', 'Papelaria', 'Industrial'];
  const itensDocs = [];
  for (let i = 1; i <= itens; i += 1) {
    itensDocs.push({
      sku: `SKU-${String(i).padStart(4, '0')}`,
      name: `Item de Catálogo ${i}`,
      category: categorias[i % categorias.length],
      price: Number((10 + (i % 90) + Math.random()).toFixed(2)),
      stock: (i * 3) % 200,
      active: i % 5 !== 0,
    });
  }
  await CatalogItem.insertMany(itensDocs);

  return { carregado: true, usuarios, projetos, itens, senha, doArquivo };
}

module.exports = { carregarDemo };
