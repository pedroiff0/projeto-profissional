const AppError = require('../utils/AppError');

async function listar({ userId, role, filtro = {}, page = 1, limit = 20 }, models) {
  const Project = models.Project;
  const q = { ...filtro };
  // Usuario comum so ve seus proprios projetos; admin ve tudo.
  if (role !== 'admin') q.ownerId = userId;
  const [items, total] = await Promise.all([
    Project.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Project.countDocuments(q),
  ]);
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function obter(id, userId, role, models) {
  const Project = models.Project;
  const p = await Project.findById(id);
  if (!p) throw new AppError('Projeto nao encontrado', 404);
  if (role !== 'admin' && String(p.ownerId) !== String(userId)) {
    throw new AppError('Acesso negado', 403);
  }
  return p;
}

async function criar(data, userId, userName, models) {
  const Project = models.Project;
  return Project.create({ ...data, ownerId: userId, ownerName: userName || '' });
}

async function atualizar(id, data, userId, role, models) {
  const Project = models.Project;
  const p = await obter(id, userId, role, models);
  if (data.name !== undefined) p.name = data.name;
  if (data.description !== undefined) p.description = data.description;
  if (data.status !== undefined) p.status = data.status;
  if (data.tags !== undefined) p.tags = data.tags;
  await p.save();
  return p;
}

async function remover(id, userId, role, models) {
  const Project = models.Project;
  const p = await obter(id, userId, role, models);
  await p.deleteOne();
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
