const AppError = require('../utils/AppError');

async function listar({ userId, role, filtro = {}, page = 1, limit = 200, demoBypass = false }, models) {
  const Task = models.Task;
  const q = { ...filtro };
  if (role !== 'admin' && !demoBypass) q.ownerId = userId;
  const [items, total] = await Promise.all([
    Task.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Task.countDocuments(q),
  ]);
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function obter(id, userId, role, models, demoBypass = false) {
  const Task = models.Task;
  const t = await Task.findById(id);
  if (!t) throw new AppError('Tarefa nao encontrada', 404);
  if (role !== 'admin' && !demoBypass && String(t.ownerId) !== String(userId)) {
    throw new AppError('Acesso negado', 403);
  }
  return t;
}

async function criar(data, userId, userName, models) {
  const Task = models.Task;
  const clean = sanitizarCampos(data);
  return Task.create({ ...clean, ownerId: userId, ownerName: userName || '' });
}

async function atualizar(id, data, userId, role, models, demoBypass = false) {
  const Task = models.Task;
  const t = await obter(id, userId, role, models, demoBypass);
  const clean = sanitizarCampos(data);
  if (clean.titulo !== undefined) t.titulo = clean.titulo;
  if (clean.descricao !== undefined) t.descricao = clean.descricao;
  if (clean.status !== undefined) {
    t.status = clean.status;
    if (clean.status === 'concluido') { if (!t.entregueEm) t.entregueEm = new Date(); }
    else t.entregueEm = null;
  }
  if (clean.projetoId !== undefined) t.projetoId = clean.projetoId || null;
  if (clean.profissionalId !== undefined) t.profissionalId = clean.profissionalId || null;
  if (clean.tags !== undefined) t.tags = clean.tags;
  if (clean.dataInicio !== undefined) t.dataInicio = clean.dataInicio || null;
  if (clean.horario !== undefined) t.horario = clean.horario || '';
  if (clean.prazo !== undefined) t.prazo = clean.prazo || null;
  if (clean.dificuldade !== undefined) t.dificuldade = clean.dificuldade ?? null;
  if (clean.minutosFoco !== undefined) t.minutosFoco = Number(clean.minutosFoco) || 0;
  if (clean.comentarios !== undefined) t.comentarios = clean.comentarios;
  if (clean.arquivos !== undefined) t.arquivos = clean.arquivos;
  if (clean.links !== undefined) t.links = clean.links;
  await t.save();
  return t;
}

// Normaliza e limita os campos aceitos (evita escrita de chaves nao mapeadas).
function sanitizarCampos(data) {
  const out = {};
  const estrito = (v) => (typeof v === 'string' ? v.trim() : v);
  if (data.titulo !== undefined) out.titulo = estrito(data.titulo);
  if (data.descricao !== undefined) out.descricao = estrito(data.descricao);
  if (data.status !== undefined) out.status = data.status;
  if (data.projetoId !== undefined) out.projetoId = data.projetoId || null;
  if (data.profissionalId !== undefined) out.profissionalId = data.profissionalId || null;
  if (Array.isArray(data.tags)) out.tags = data.tags.map((x) => String(x).trim()).filter(Boolean).slice(0, 12);
  if (data.dataInicio !== undefined) out.dataInicio = data.dataInicio || null;
  if (data.horario !== undefined) out.horario = String(data.horario || '').trim().slice(0, 32);
  if (data.prazo !== undefined) out.prazo = data.prazo || null;
  if (data.dificuldade !== undefined) out.dificuldade = data.dificuldade ?? null;
  if (Array.isArray(data.comentarios)) out.comentarios = data.comentarios.slice(0, 200);
  if (Array.isArray(data.arquivos)) out.arquivos = data.arquivos.slice(0, 50);
  if (Array.isArray(data.links)) out.links = data.links.slice(0, 50);
  return out;
}

async function remover(id, userId, role, models, demoBypass = false) {
  const Task = models.Task;
  const t = await obter(id, userId, role, models, demoBypass);
  await t.deleteOne();
  return true;
}

// Registra minutos de foco (Pomodoro) em uma tarefa especifica e no resumo do dono (Meta).
async function registrarFoco(id, minutos, userId, role, models, demoBypass = false) {
  const Task = models.Task;
  const t = await obter(id, userId, role, models, demoBypass);
  const min = Number(minutos) > 0 ? Number(minutos) : 25;
  t.minutosFoco = (t.minutosFoco || 0) + min;
  await t.save();
  let meta = null;
  try {
    const metaService = require('./metaService');
    meta = await metaService.registrarFoco(userId, min, models);
  } catch (_) { /* meta opcional */ }
  return { task: t, meta };
}

module.exports = { listar, obter, criar, atualizar, remover, registrarFoco };
