const userSchema = require('./user.model');
const auditLogSchema = require('./auditLog.model');
const projectSchema = require('./project.model');
const catalogItemSchema = require('./catalogItem.model');
const professionalSchema = require('./professional.model');
const taskSchema = require('./task.model');
const metaSchema = require('./meta.model');

// Registra os models numa connection específica (por banco/modo). Cacheia por
// connection para não recriar a cada request. Os nomes dos models são fixos;
// o isolamento vem da connection (database) em que cada um vive.
const cache = new WeakMap();

function getModels(conn) {
  if (cache.has(conn)) return cache.get(conn);
  const models = {
    User: conn.model('User', userSchema),
    AuditLog: conn.model('AuditLog', auditLogSchema),
    Project: conn.model('Project', projectSchema),
    CatalogItem: conn.model('CatalogItem', catalogItemSchema),
    Professional: conn.model('Professional', professionalSchema),
    Task: conn.model('Task', taskSchema),
    Meta: conn.model('Meta', metaSchema),
  };
  cache.set(conn, models);
  return models;
}

module.exports = { getModels };
