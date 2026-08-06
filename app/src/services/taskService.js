const AppError = require('../utils/AppError');

async function listar({ userId, role, filtro = {} }, models) {
  const Task = models.Task;
  const q = { ...filtro };
  // Usuario comum so ve suas tarefas; admin ve tudo.
  if (role !== 'admin') q.ownerId = userId;
  const items = await Task.find(q).sort({ dueDate: 1, createdAt: -1 }).lean();
  return items;
}

async function obter(id, userId, role, models) {
  const Task = models.Task;
  const t = await Task.findById(id);
  if (!t) throw new AppError('Tarefa nao encontrada', 404);
  if (role !== 'admin' && String(t.ownerId) !== String(userId)) {
    throw new AppError('Acesso negado', 403);
  }
  return t;
}

async function criar(data, userId, userName, models) {
  const Task = models.Task;
  const doc = { ...data, ownerId: userId, ownerName: userName || '' };
  if (data.assigneeId) {
    const u = await models.User.findById(data.assigneeId).lean();
    doc.assigneeName = u ? u.name : '';
  }
  return Task.create(doc);
}

async function atualizar(id, data, userId, role, models) {
  const Task = models.Task;
  const t = await obter(id, userId, role, models);
  const campos = ['title', 'description', 'status', 'dueDate'];
  for (const c of campos) {
    if (data[c] !== undefined) t[c] = data[c];
  }
  if (data.assigneeId !== undefined) {
    if (data.assigneeId) {
      const u = await models.User.findById(data.assigneeId).lean();
      t.assigneeId = data.assigneeId;
      t.assigneeName = u ? u.name : '';
    } else {
      t.assigneeId = null;
      t.assigneeName = '';
    }
  }
  await t.save();
  return t;
}

async function remover(id, userId, role, models) {
  const Task = models.Task;
  const t = await obter(id, userId, role, models);
  await t.deleteOne();
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
