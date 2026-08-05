const Project = require('../models/project.model');
const NotFoundError = require('../utils/AppError');

async function listar({ userId, role, filtro = {}, page = 1, limit = 20 }) {
  const q = { ...filtro };
  // Usuario comum so ve seus projetos; admin ve tudo.
  if (role !== 'admin') q.ownerId = userId;
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    Project.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(q),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

async function obter(id, userId, role) {
  const p = await Project.findById(id);
  if (!p) throw new NotFoundError('Projeto nao encontrado', 404);
  if (role !== 'admin' && String(p.ownerId) !== String(userId)) {
    throw new NotFoundError('Projeto nao encontrado', 404);
  }
  return p;
}

async function criar(dados, userId, userName) {
  return Project.create({ ...dados, ownerId: userId, ownerName: userName });
}

async function atualizar(id, dados, userId, role) {
  const p = await obter(id, userId, role);
  Object.assign(p, dados);
  await p.save();
  return p;
}

async function remover(id, userId, role) {
  const p = await obter(id, userId, role);
  await p.deleteOne();
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
