const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { signToken } = require('../middleware/auth');

function generateToken(user) {
  return signToken(user, 'production');
}

const SALT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000;

// Hash descartavel usado para igualar o tempo de resposta quando o usuario
// nao existe (mitiga enumeracao de contas por timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety', SALT_ROUNDS);

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword || false,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt,
  };
}

function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ~144 bits de entropia, legivel o bastante para repassar ao usuario.
function gerarSenhaTemporaria() {
  return crypto.randomBytes(18).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// models = models da connection do modo (banco) atual; mode isola o JWT.
async function login({ email, password }, models, mode) {
  const User = models.User;
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH); // tempo constante
    throw new AppError('Credenciais invalidas', 401);
  }
  if (!user.isActive) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new AppError('Credenciais invalidas', 401);
  }
  if (user.isLocked()) {
    const min = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw new AppError(`Conta bloqueada temporariamente. Tente novamente em ${min} min.`, 429);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= env.maxFailedAttempts) {
      user.lockedUntil = new Date(Date.now() + env.lockoutMs);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new AppError('Credenciais invalidas', 401);
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  return { user: toPublicUser(user), token: signToken(user, mode) };
}

// Troca de senha (primeiro acesso ou usuario autenticado). Invalida todas as
// sessoes anteriores via tokenValidAfter.
async function changePassword(userId, { currentPassword, newPassword }, models) {
  const User = models.User;
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError('Usuario nao encontrado', 404);

  if (!user.mustChangePassword) {
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) throw new AppError('Senha atual incorreta', 401);
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new AppError('A nova senha deve ser diferente da atual', 422);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.tokenValidAfter = new Date();
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();

  return { user: toPublicUser(user), token: signToken(user) };
}

// Sempre "sucesso" para o chamador: nao revela se o e-mail existe.
async function requestPasswordReset(email, models) {
  const User = models.User;
  const user = await User.findOne({ email, isActive: true });
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = sha256(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  // Producao: enviar por e-mail. O token NUNCA deve ser logado.
  return { user, token };
}

async function resetPassword({ token, newPassword }, models) {
  const User = models.User;
  const tokenHash = sha256(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpires');

  if (!user) throw new AppError('Token de redefinicao invalido ou expirado', 400);

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.mustChangePassword = false;
  user.tokenValidAfter = new Date();
  await user.save();
  return toPublicUser(user);
}

async function updateProfile(userId, data, models) {
  const User = models.User;
  const user = await User.findById(userId);
  if (!user) throw new AppError('Usuario nao encontrado', 404);
  if (data.name !== undefined) user.name = data.name;
  await user.save();
  return toPublicUser(user);
}

module.exports = {
  SALT_ROUNDS,
  toPublicUser,
  generateToken,
  hashPassword,
  verifyPassword,
  gerarSenhaTemporaria,
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
  updateProfile,
};
