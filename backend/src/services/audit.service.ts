import prisma from '../lib/prisma';

interface AuditParams {
  action: string;
  module: string;
  recordId?: string;
  details?: string;
  userId: string;
  ipAddress?: string;
}

export const createAuditLog = async (params: AuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        module: params.module,
        recordId: params.recordId,
        details: params.details,
        userId: params.userId,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};