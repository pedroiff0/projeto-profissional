const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Ordem de extracao: cookie httpOnly (web) > Bearer (API/mobile).
// Token em query string NAO e aceito: vaza em log de proxy e no Referer.
function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function resolveUser(token, mode, Models) {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  // Isolamento por banco: um token de 'demo' nao abre 'production' (e vice-versa).
  if (mode && payload.mode && payload.mode !== mode) return null;
  const UserModel = (Models && Models.User) || User;
  const user = await UserModel.findById(payload.id);
  if (!user || !user.isActive) return null;
  // Invalidacao global de sessao: token emitido antes de tokenValidAfter
  // (troca de senha, logout global, desativacao) e recusado.
  if (payload.iat && user.tokenValidAfter) {
    const validAfterSec = Math.floor(user.tokenValidAfter.getTime() / 1000);
    if (payload.iat < validAfterSec) return null;
  }
  return user;
}

function toRequestUser(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    mustChangePassword: user.mustChangePassword || false,
  };
}

// API: responde 401 em JSON. No modo demo, usuario anonimo e tratado como o
// "demo user" (demo1 do banco demo) — acesso livre, escopado ao banco demo.
async function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await auth._resolve(token, req.mode, req.models);
      if (user) {
        req.user = toRequestUser(user);
        return next();
      }
    }
    if (req.mode === 'demo') {
      const demoUser = await req.models.User.findOne({ email: 'demo1@example.com' }).lean();
      if (demoUser) {
        req.user = toRequestUser(demoUser);
        return next();
      }
    }
    throw new AppError('Autenticacao necessaria', 401);
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Token invalido ou expirado', 401));
  }
}

// Gera token ja incluindo o modo (banco) — usado pelo auth e pelo autologin demo.
function signToken(user, mode) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, mode: mode || 'production' },
    env.jwtSecret,
    { algorithm: 'HS256', expiresIn: env.jwtExpiresIn }
  );
}

// exposto para que o resolveUser receba Models quando houver (evita require circular).
auth._resolve = resolveUser;

module.exports = { auth, extractToken, resolveUser, toRequestUser, signToken };
