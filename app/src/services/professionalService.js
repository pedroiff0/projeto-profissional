const AppError = require('../utils/AppError');

async function listar({ userId, role, filtro = {}, page = 1, limit = 200, demoBypass = false }, models) {
  const Professional = models.Professional;
  const q = { ...filtro };
  if (role !== 'admin' && !demoBypass) q.ownerId = userId;
  const [items, total] = await Promise.all([
    Professional.find(q).sort({ nome: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Professional.countDocuments(q),
  ]);
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function obter(id, userId, role, models, demoBypass = false) {
  const Professional = models.Professional;
  const p = await Professional.findById(id);
  if (!p) throw new AppError('Profissional nao encontrado', 404);
  if (role !== 'admin' && !demoBypass && String(p.ownerId) !== String(userId)) {
    throw new AppError('Acesso negado', 403);
  }
  return p;
}

async function criar(data, userId, userName, models) {
  const Professional = models.Professional;
  return Professional.create({ ...data, ownerId: userId, ownerName: userName || '' });
}

async function atualizar(id, data, userId, role, models, demoBypass = false) {
  const Professional = models.Professional;
  const p = await obter(id, userId, role, models, demoBypass);
  if (data.nome !== undefined) p.nome = data.nome;
  if (data.funcao !== undefined) p.funcao = data.funcao;
  if (data.contato !== undefined) p.contato = data.contato;
  await p.save();
  return p;
}

async function remover(id, userId, role, models, demoBypass = false) {
  const Professional = models.Professional;
  const p = await obter(id, userId, role, models, demoBypass);
  await p.deleteOne();
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
