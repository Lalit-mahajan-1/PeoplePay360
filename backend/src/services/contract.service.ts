import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

export class ContractService {
  async getAll(filters: { employeeId?: string; status?: string; departmentId?: string }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    return prisma.contract.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        salaryStructure: { select: { id: true, name: true, code: true } },
        workingSchedule: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ employeeId: 'asc' }, { startDate: 'desc' }],
    });
  }

  async getById(id: string) {
    return prisma.contract.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        salaryStructure: {
          include: {
            rules: {
              orderBy: { sequence: 'asc' },
              include: { salaryRule: true },
            },
          },
        },
        workingSchedule: { include: { days: true } },
        payslips: {
          select: { id: true, periodStart: true, periodEnd: true, status: true, netAmount: true },
          orderBy: { periodStart: 'desc' },
          take: 5,
        },
      },
    });
  }

  async getActiveForEmployee(employeeId: string, periodDate?: string) {
    const date = periodDate ? new Date(periodDate) : new Date();
    return prisma.contract.findFirst({
      where: {
        employeeId,
        status: 'ACTIVE',
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
      include: {
        salaryStructure: {
          include: { rules: { orderBy: { sequence: 'asc' }, include: { salaryRule: true } } },
        },
        workingSchedule: { include: { days: true } },
      },
    });
  }

  async create(data: any, authUser: AuthUser) {
    const { employeeId, startDate, endDate, wage, salaryStructureId, ...rest } = data;

    if (!employeeId || !startDate || !wage || !salaryStructureId) {
      throw { status: 400, message: 'employeeId, startDate, wage, salaryStructureId are required' };
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw { status: 404, message: 'Employee not found' };

    const structure = await prisma.salaryStructure.findUnique({ where: { id: salaryStructureId } });
    if (!structure) throw { status: 404, message: 'Salary structure not found' };

    const count = await prisma.contract.count();
    const contractNumber = `CTR${String(count + 1).padStart(5, '0')}`;

    const newContract = await prisma.contract.create({
      data: {
        contractNumber,
        employeeId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        wage,
        salaryStructureId,
        ...rest,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.employmentHistory.create({
      data: {
        employeeId,
        eventType: data.status === 'ACTIVE' ? 'HIRE' : 'CONTRACT_RENEWAL',
        effectiveDate: new Date(startDate),
        departmentId: data.departmentId,
        jobPosition: data.jobPosition,
        employmentStatus: 'ACTIVE',
        notes: `Contract ${contractNumber} created`,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'CONTRACT',
      recordId: newContract.id,
      details: `Created contract ${contractNumber} for ${newContract.employee.firstName} ${newContract.employee.lastName}`,
      userId: authUser.userId,
    });

    return this.getById(newContract.id);
  }

  async update(id: string, data: any, authUser: AuthUser) {
    const existing = await prisma.contract.findUnique({ where: { id }, include: { employee: true } });
    if (!existing) throw { status: 404, message: 'Contract not found' };

    const updateData: any = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;

    const updated = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });

    await createAuditLog({
      action: 'UPDATE',
      module: 'CONTRACT',
      recordId: id,
      details: `Updated contract ${existing.contractNumber}`,
      userId: authUser.userId,
    });

    return this.getById(id);
  }

  async delete(id: string, authUser: AuthUser) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: 'Contract not found' };

    const payslipCount = await prisma.payslip.count({ where: { contractId: id } });
    if (payslipCount > 0) {
      throw { status: 400, message: 'Cannot delete contract with existing payslips' };
    }

    await prisma.contract.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      module: 'CONTRACT',
      recordId: id,
      details: `Deleted contract ${existing.contractNumber}`,
      userId: authUser.userId,
    });
  }
}

export const contractService = new ContractService();
