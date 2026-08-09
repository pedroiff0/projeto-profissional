const AppError = require('../utils/AppError');

async function obterOuCriar(userId, models) {
  const Meta = models.Meta;
  let m = await Meta.findOne({ ownerId: userId });
  if (!m) m = await Meta.create({ ownerId: userId });
  return m;
}

async function obter(userId, models) {
  return obterOuCriar(userId, models);
}

async function salvar(userId, data, models) {
  const m = await obterOuCriar(userId, models);
  if (data.metaSemana !== undefined) m.metaSemana = Math.max(0, Number(data.metaSemana) || 0);
  await m.save();
  return m;
}

async function registrarFoco(userId, minutos, models) {
  const m = await obterOuCriar(userId, models);
  m.focoMinutos = (m.focoMinutos || 0) + (Number(minutos) || 0);
  m.pomodoros = (m.pomodoros || 0) + 1;
  await m.save();
  return m;
}

module.exports = { obter, salvar, registrarFoco };
