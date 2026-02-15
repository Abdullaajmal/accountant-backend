const AuditLog = require('@/models/appModels/AuditLog');

const createAuditLog = async (req, action, entity, entityId = null, changes = null) => {
  try {
    if (!req.admin) return;

    const auditLog = new AuditLog({
      action,
      entity,
      entityId,
      userId: req.admin._id,
      userName: req.admin.name,
      userEmail: req.admin.email,
      changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      description: `${action} ${entity}${entityId ? ` (${entityId})` : ''}`,
    });

    await auditLog.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - audit logging should not break the main flow
  }
};

module.exports = { createAuditLog };
