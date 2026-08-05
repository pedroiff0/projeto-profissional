// Registro de auditoria "best effort": uma falha aqui nunca pode derrubar a
// requisicao principal. Usa o AuditLog da connection do modo (req.models),
// caindo para o model global se não houver contexto de request.
const AuditLogGlobal = require('../models/auditLog.model');
const { getModels } = require('../models/registry');

async function audit(action, { req, actorId = null, targetId = null, meta = {} } = {}) {
  try {
    const Models = (req && req.models) || { AuditLog: AuditLogGlobal };
    const AuditLog = Models.AuditLog;
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
