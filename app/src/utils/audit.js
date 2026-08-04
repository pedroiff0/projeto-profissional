const AuditLog = require('../models/auditLog.model');

// Registro de auditoria "best effort": uma falha aqui nunca pode derrubar a
// requisicao principal.
async function audit(action, { req, actorId = null, targetId = null, meta = {} } = {}) {
  try {
    await AuditLog.create({
      action,
      actorId,
      targetId,
      ip: req?.ip || '',
      userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 300),
      meta,
    });
  } catch (err) {
    console.error(`[audit] falha ao registrar ${action}: ${err.message}`);
  }
}

module.exports = { audit };
