const authService = require('../services/authService');
const { audit } = require('../utils/audit');
const env = require('../config/env');

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/',
  maxAge: 2 * 60 * 60 * 1000,
};

async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    await audit('auth.login.success', { req, actorId: user.id });
    // token tambem no corpo para clientes nao-browser (Bearer).
    res.status(200).json({ user, token });
  } catch (err) {
    await audit('auth.login.failure', { req, meta: { email: req.body?.email } });
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: env.cookieSecure, path: '/' });
  await audit('auth.logout', { req, actorId: req.user?.id || null });
  res.status(200).json({ ok: true });
}

async function me(req, res) {
  res.status(200).json({ user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { user, token } = await authService.changePassword(req.user.id, req.body);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    await audit('auth.password.changed', { req, actorId: user.id });
    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    if (result) {
      await audit('auth.password.reset_requested', { req, actorId: result.user._id });
      // TODO(producao): enviar o link por e-mail. Em dev, o link vai ao log.
      if (env.nodeEnv !== 'production') {
        console.log(`[dev] Link de reset: ${env.appBaseUrl}/reset-password?token=${result.token}`);
      }
    }
    // Resposta identica exista ou nao a conta (anti-enumeracao).
    res.status(200).json({ message: 'Se o e-mail existir, um link de redefinicao foi enviado.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const user = await authService.resetPassword(req.body);
    await audit('auth.password.reset_completed', { req, actorId: user.id });
    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me, updateProfile, changePassword, forgotPassword, resetPassword };
