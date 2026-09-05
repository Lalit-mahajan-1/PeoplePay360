import prisma from '../lib/prisma';

interface AuditLogInput {
  action: string;
  module: string;
  recordId?: string;
  details?: string;
  userId?: string;
}

export const createAuditLog = async (data: AuditLogInput) => {
  try {
    if (!data.userId) {
      return;
    }
    await prisma.auditLog.create({
      data: {
        action: data.action,
        module: data.module,
        recordId: data.recordId,
        details: data.details,
        userId: data.userId,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw — audit failure should not break the main operation
  }
};