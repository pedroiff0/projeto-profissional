const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'auth.login.success',
        'auth.login.failure',
        'auth.logout',
        'auth.password.changed',
        'auth.password.reset_requested',
        'auth.password.reset_completed',
        'admin.user.created',
        'admin.user.updated',
        'admin.user.deactivated',
        'admin.user.reactivated',
        'admin.user.password_reset',
      ],
      index: true,
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Retencao: 180 dias.
auditLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = auditLogSchema;

