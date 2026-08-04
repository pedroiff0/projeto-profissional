const mongoose = require('mongoose');

// Modelo minimo de usuario: dois papeis (admin, user). Registro NAO e
// autoatendido — o admin provisiona a conta e o sistema devolve uma senha
// temporaria (mustChangePassword=true).
const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'user'], required: true, default: 'user', index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },

    // Identificador de login. unique + lowercase; o indice unico e criado
    // explicitamente abaixo para deixar o contrato do banco visivel.
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },

    // NUNCA armazenar senha em claro. Bcrypt (cost 12) apenas.
    // select:false => nenhuma query devolve o hash sem pedir explicitamente.
    passwordHash: { type: String, required: true, select: false },

    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },

    // Sessoes emitidas antes desta data sao invalidas (logout global,
    // troca de senha, desativacao). Comparado com o `iat` do JWT.
    tokenValidAfter: { type: Date, default: () => new Date() },

    lastLoginAt: { type: Date, default: null },

    // Bloqueio temporario de conta por senha errada repetida.
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    // Reset de senha: guarda apenas o SHA-256 do token, nunca o token.
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ passwordResetExpires: 1 }, { expireAfterSeconds: 0, sparse: true });

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

module.exports = mongoose.model('User', userSchema);
