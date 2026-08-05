const AppError = require('../utils/AppError');
const authService = require('./authService');

// models = models da connection do modo (banco) atual.
async function criarUsuario({ name, email, role }, models) {
  const User = models.User;
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Ja existe um usuario com este e-mail', 409);

  const senhaTemporaria = authService.gerarSenhaTemporaria();
  const passwordHash = await authService.hashPassword(senhaTemporaria);

  const user = await User.create({ name, email, role, passwordHash, mustChangePassword: true });

  return { user: authService.toPublicUser(user), senhaTemporaria };
}

async function listarUsuarios({ q, role, page, limit }, models) {
  const User = models.User;
  const filtro = {};
  if (role) filtro.role = role;
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filtro.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }];
  }

  const [items, total] = await Promise.all([
    User.find(filtro).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filtro),
  ]);

  return {
    items: items.map((u) => authService.toPublicUser({ ...u, _id: u._id })),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function atualizarUsuario(adminId, id, data, models) {
  const User = models.User;
  const user = await User.findById(id);
  if (!user) throw new AppError('Usuario nao encontrado', 404);

  if (String(id) === String(adminId) && (data.role === 'user' || data.isActive === false)) {
    throw new AppError('Voce nao pode rebaixar ou desativar a propria conta', 422);
  }
  if (data.role === 'user' || data.isActive === false) {
    const outrosAdmins = await User.countDocuments({
      role: 'admin', isActive: true, _id: { $ne: user._id },
    });
    if (user.role === 'admin' && outrosAdmins === 0) {
      throw new AppError('Deve existir ao menos um administrador ativo', 422);
    }
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.role !== undefined) user.role = data.role;
  if (data.isActive !== undefined) {
    user.isActive = data.isActive;
    if (!data.isActive) user.tokenValidAfter = new Date();
  }

  await user.save();
  return authService.toPublicUser(user);
}

async function resetarSenha(id, models) {
  const User = models.User;
  const user = await User.findById(id);
  if (!user) throw new AppError('Usuario nao encontrado', 404);

  const senhaTemporaria = authService.gerarSenhaTemporaria();
  user.passwordHash = await authService.hashPassword(senhaTemporaria);
  user.mustChangePassword = true;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.tokenValidAfter = new Date();
  await user.save();

  return { user: authService.toPublicUser(user), senhaTemporaria };
}

module.exports = { criarUsuario, listarUsuarios, atualizarUsuario, resetarSenha };
