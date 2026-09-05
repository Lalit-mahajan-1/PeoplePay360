import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

export class TimeOffService {
  // ========== TIME OFF TYPES ==========
  async getAllTypes(includeInactive = false) {
    return prisma.timeOffType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { allocations: true, requests: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createTimeOffType(data: any, authUser: AuthUser) {
    const existingCode = await prisma.timeOffType.findUnique({ where: { code: data.code } });
    if (existingCode) throw { status: 409, message: 'Time off type code already exists' };

    const type = await prisma.timeOffType.create({ data });
    await createAuditLog({
      action: 'CREATE', module: 'TIME_OFF_TYPE', recordId: type.id,
      details: `Created time off type: ${data.name} (${data.code})`,
      userId: authUser.userId,
    });
    return type;
  }

  async updateTimeOffType(id: string, data: any, authUser: AuthUser) {
    const type = await prisma.timeOffType.update({ where: { id }, data });
    await createAuditLog({
      action: 'UPDATE', module: 'TIME_OFF_TYPE', recordId: id,
      details: `Updated time off type: ${type.name}`,
      userId: authUser.userId,
    });
    return type;
  }

  async deleteTimeOffType(id: string, authUser: AuthUser) {
    const existing = await prisma.timeOffType.findUnique({
      where: { id }, include: { _count: { select: { allocations: true, requests: true } } },
    });
    if (!existing) throw { status: 404, message: 'Time off type not found' };
    if (existing._count.allocations > 0 || existing._count.requests > 0) {
      throw { status: 400, message: 'Cannot delete type with allocations/requests. Deactivate instead.' };
    }
    await prisma.timeOffType.delete({ where: { id } });
    await createAuditLog({
      action: 'DELETE', module: 'TIME_OFF_TYPE', recordId: id,
      details: `Deleted time off type: ${existing.name}`,
      userId: authUser.userId,
    });
  }

  // ========== LEAVE ALLOCATIONS ==========
  async getAllAllocations(filters: { employeeId?: string; timeOffTypeId?: string; status?: string }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.timeOffTypeId) where.timeOffTypeId = filters.timeOffTypeId;
    if (filters.status) where.status = filters.status;

    return prisma.leaveAllocation.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        timeOffType: true,
      },
      orderBy: [{ employeeId: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getMyAllocations(employeeId: string) {
    return prisma.leaveAllocation.findMany({
      where: { employeeId, status: 'APPROVED' },
      include: {
        timeOffType: true,
        requests: { where: { status: { in: ['PENDING', 'APPROVED'] } }, select: { id: true, requestedUnit: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }).then(allocs => allocs.map(a => ({
      ...a,
      pending: a.requests.filter(r => r.status === 'PENDING').reduce((s, r) => s + Number(r.requestedUnit), 0),
      taken: Number(a.consumed),
      remaining: Number(a.allocated) - Number(a.consumed),
    })));
  }

  async createAllocation(data: any, authUser: AuthUser) {
    const { employeeId, timeOffTypeId, allocated, validFrom, validTo, notes } = data;
    if (!employeeId || !timeOffTypeId || !allocated || !validFrom) {
      throw { status: 400, message: 'employeeId, timeOffTypeId, allocated, validFrom are required' };
    }
    const allocation = await prisma.leaveAllocation.create({
      data: {
        employeeId, timeOffTypeId, allocated,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null,
        notes, status: data.status || 'DRAFT',
      },
      include: { employee: true, timeOffType: true },
    });
    await createAuditLog({
      action: 'CREATE', module: 'LEAVE_ALLOCATION', recordId: allocation.id,
      details: `Allocated ${allocated} ${allocation.timeOffType.name} to ${allocation.employee.firstName} ${allocation.employee.lastName}`,
      userId: authUser.userId,
    });
    return allocation;
  }

  async approveAllocation(id: string, authUser: AuthUser) {
    const allocation = await prisma.leaveAllocation.update({
      where: { id }, data: { status: 'APPROVED' },
      include: { employee: true, timeOffType: true },
    });
    await createAuditLog({
      action: 'APPROVE', module: 'LEAVE_ALLOCATION', recordId: id,
      details: `Approved allocation for ${allocation.employee.firstName} ${allocation.employee.lastName}`,
      userId: authUser.userId,
    });
    return allocation;
  }

  async updateAllocation(id: string, data: any, authUser: AuthUser) {
    const updateData: any = { ...data };
    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validTo) updateData.validTo = updateData.validTo ? new Date(updateData.validTo) : null;
    const allocation = await prisma.leaveAllocation.update({ where: { id }, data: updateData });
    await createAuditLog({ action: 'UPDATE', module: 'LEAVE_ALLOCATION', recordId: id, details: `Updated allocation`, userId: authUser.userId });
    return allocation;
  }

  // ========== LEAVE REQUESTS ==========
  async getAllRequests(filters: { employeeId?: string; status?: string; timeOffTypeId?: string }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.timeOffTypeId) where.timeOffTypeId = filters.timeOffTypeId;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
        timeOffType: true,
        allocation: { select: { id: true, allocated: true, consumed: true } },
        reviewer: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequests(employeeId: string) {
    return prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { timeOffType: true, reviewer: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(data: any, authUser: AuthUser, overrideEmployeeId?: string) {
    const { timeOffTypeId, startDate, endDate, requestedUnit, reason } = data;
    const employeeId = overrideEmployeeId || (await this.getEmployeeIdFromAuth(authUser));
    if (!employeeId) throw { status: 400, message: 'No employee record linked to this account' };

    if (!timeOffTypeId || !startDate || !endDate || !requestedUnit) {
      throw { status: 400, message: 'timeOffTypeId, startDate, endDate, requestedUnit are required' };
    }

    const type = await prisma.timeOffType.findUnique({ where: { id: timeOffTypeId } });
    if (!type) throw { status: 404, message: 'Time off type not found' };

    let allocationId: string | undefined;
    if (type.requiresAllocation) {
      const allocation = await prisma.leaveAllocation.findFirst({
        where: {
          employeeId, timeOffTypeId, status: 'APPROVED',
          validFrom: { lte: new Date(startDate) },
          OR: [{ validTo: null }, { validTo: { gte: new Date(endDate) } }],
        },
      });
      if (!allocation) throw { status: 400, message: `No approved allocation available for ${type.name}` };

      const pending = await prisma.leaveRequest.aggregate({
        where: { allocationId: allocation.id, status: 'PENDING' },
        _sum: { requestedUnit: true },
      });
      const totalReserved = Number(allocation.consumed) + Number(pending._sum.requestedUnit || 0);
      if (totalReserved + Number(requestedUnit) > Number(allocation.allocated)) {
        throw { status: 400, message: 'Insufficient leave balance for this request' };
      }
      allocationId = allocation.id;
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId, timeOffTypeId, allocationId,
        startDate: new Date(startDate), endDate: new Date(endDate),
        requestedUnit, reason, status: type.requiresApproval ? 'PENDING' : 'APPROVED',
      },
      include: { employee: true, timeOffType: true },
    });

    if (!type.requiresApproval && allocationId) {
      await this.consumeAllocation(allocationId, Number(requestedUnit));
    }

    await createAuditLog({
      action: 'CREATE', module: 'LEAVE_REQUEST', recordId: request.id,
      details: `${request.employee.firstName} requested ${requestedUnit} ${type.name}`,
      userId: authUser.userId,
    });
    return request;
  }

  async reviewRequest(id: string, approve: boolean, notes: string | undefined, authUser: AuthUser) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id }, include: { timeOffType: true, allocation: true },
    });
    if (!request) throw { status: 404, message: 'Leave request not found' };
    if (request.status !== 'PENDING') throw { status: 400, message: `Cannot review request in status: ${request.status}` };

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approve ? 'APPROVED' : 'REFUSED',
        reviewerId: authUser.userId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
      include: { employee: true, timeOffType: true },
    });

    if (approve && updated.allocationId) {
      await this.consumeAllocation(updated.allocationId, Number(updated.requestedUnit));
    }

    await createAuditLog({
      action: approve ? 'APPROVE' : 'REFUSE', module: 'LEAVE_REQUEST', recordId: id,
      details: `${approve ? 'Approved' : 'Refused'} leave request for ${updated.employee.firstName} ${updated.employee.lastName}`,
      userId: authUser.userId,
    });
    return updated;
  }

  async cancelRequest(id: string, authUser: AuthUser) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id }, include: { allocation: true, employee: true },
    });
    if (!request) throw { status: 404, message: 'Leave request not found' };
    if (!['DRAFT', 'PENDING', 'APPROVED'].includes(request.status)) {
      throw { status: 400, message: 'Cannot cancel this request' };
    }
    const wasApproved = request.status === 'APPROVED';
    const updated = await prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
    if (wasApproved && request.allocationId) {
      await prisma.leaveAllocation.update({
        where: { id: request.allocationId },
        data: { consumed: { decrement: Number(request.requestedUnit) } },
      });
    }
    await createAuditLog({
      action: 'CANCEL', module: 'LEAVE_REQUEST', recordId: id,
      details: `Cancelled leave request for ${request.employee.firstName}`,
      userId: authUser.userId,
    });
    return updated;
  }

  private async consumeAllocation(allocationId: string, units: number) {
    await prisma.leaveAllocation.update({
      where: { id: allocationId },
      data: { consumed: { increment: units } },
    });
  }

  private async getEmployeeIdFromAuth(authUser: AuthUser): Promise<string | undefined> {
    if (authUser.employeeId) return authUser.employeeId;
    const user = await prisma.user.findUnique({ where: { id: authUser.userId }, include: { employee: true } });
    return user?.employee?.id;
  }
}

export const timeOffService = new TimeOffService();
