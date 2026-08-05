const userService = require('../services/userService');
const { listarUsuariosSchema } = require('../schemas/admin.schemas');
const { audit } = require('../utils/audit');

async function criarUsuario(req, res, next) {
  try {
    const { user, senhaTemporaria } = await userService.criarUsuario(req.body, req.models);
    await audit('admin.user.created', { req, actorId: req.user.id, targetId: user.id });
    // senhaTemporaria existe SO nesta resposta — o admin copia e repassa.
    res.status(201).json({ user, senhaTemporaria });
  } catch (err) {
    next(err);
  }
}

async function listarUsuarios(req, res, next) {
  try {
    const query = listarUsuariosSchema.parse(req.query);
    res.status(200).json(await userService.listarUsuarios(query, req.models));
  } catch (err) {
    next(err);
  }
}

async function atualizarUsuario(req, res, next) {
  try {
    const user = await userService.atualizarUsuario(req.user.id, req.params.id, req.body, req.models);
    const action = req.body.isActive === false
      ? 'admin.user.deactivated'
      : req.body.isActive === true ? 'admin.user.reactivated' : 'admin.user.updated';
    await audit(action, { req, actorId: req.user.id, targetId: user.id });
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function resetarSenha(req, res, next) {
  try {
    const { user, senhaTemporaria } = await userService.resetarSenha(req.params.id, req.models);
    await audit('admin.user.password_reset', { req, actorId: req.user.id, targetId: user.id });
    res.status(200).json({ user, senhaTemporaria });
  } catch (err) {
    next(err);
  }
}

module.exports = { criarUsuario, listarUsuarios, atualizarUsuario, resetarSenha };
