const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'user'], required: true, default: 'user', index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },

    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },

    passwordHash: { type: String, required: true, select: false },

    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },

    tokenValidAfter: { type: Date, default: () => new Date() },

    lastLoginAt: { type: Date, default: null },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

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

module.exports = userSchema;

