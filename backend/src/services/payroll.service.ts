import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';
import { salaryService } from './salary.service';

export class PayrollService {
  // ========== PAYRUNS ==========
  async getAllPayruns(filters: { status?: string; salaryStructureId?: string; departmentId?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.salaryStructureId) where.salaryStructureId = filters.salaryStructureId;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    const payruns = await prisma.payrun.findMany({
      where,
      include: {
        salaryStructure: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, email: true } },
        _count: { select: { payslips: true, employees: true } },
      },
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    });

    return Promise.all(payruns.map(async (p) => {
      const summary = await this.aggregatePayrunSummary(p.id);
      return {
        ...p,
        payslipCount: p._count.payslips,
        employeeCount: p._count.employees,
        ...(summary as any),
      };
    }));
  }

  async getPayrunById(id: string) {
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: {
          include: { rules: { orderBy: { sequence: 'asc' }, include: { salaryRule: true } } },
        },
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        employees: {
          include: {
            employee: {
              select: {
                id: true, firstName: true, lastName: true, employeeCode: true,
                email: true, status: true, bankName: true, bankAccountNo: true,
              },
            },
          },
        },
        payslips: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
            warnings: true,
          },
          orderBy: { employee: { lastName: 'asc' } },
        },
        warnings: { orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }] },
      },
    });
    if (!payrun) return null;

    const summary = await this.aggregatePayrunSummary(id);
    return { ...payrun, ...summary };
  }

  async getEligibleEmployeesForPayrun(salaryStructureId: string, periodStart: string, periodEnd: string, departmentId?: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(departmentId ? {
          contracts: {
            some: {
              departmentId,
              status: 'ACTIVE',
              salaryStructureId,
              startDate: { lte: end },
              OR: [{ endDate: null }, { endDate: { gte: start } }],
            },
          },
        } : {}),
        contracts: {
          some: {
            status: 'ACTIVE',
            salaryStructureId,
            startDate: { lte: end },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
          },
        },
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        contracts: {
          where: {
            status: 'ACTIVE',
            salaryStructureId,
            startDate: { lte: end },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
          },
          take: 1,
          include: { department: true, workingSchedule: true },
        },
      },
      orderBy: [{ employeeCode: 'asc' }],
    });

    return employees.map(e => ({
      ...e,
      activeContract: e.contracts[0] || null,
      department: e.contracts[0]?.department || null,
    }));
  }

  async createPayrunStep1(data: any, authUser: AuthUser) {
    const { salaryStructureId, periodStart, periodEnd, departmentId } = data;
    if (!salaryStructureId || !periodStart || !periodEnd) {
      throw { status: 400, message: 'salaryStructureId, periodStart, periodEnd are required' };
    }
    const eligible = await this.getEligibleEmployeesForPayrun(salaryStructureId, periodStart, periodEnd, departmentId);
    return {
      salaryStructureId, periodStart, periodEnd, departmentId,
      eligibleEmployees: eligible,
    };
  }

  async createPayrun(data: any, authUser: AuthUser) {
    const { name, salaryStructureId, periodStart, periodEnd, departmentId, employeeIds, notes } = data;
    if (!name || !salaryStructureId || !periodStart || !periodEnd || !employeeIds || employeeIds.length === 0) {
      throw { status: 400, message: 'name, salaryStructureId, periodStart, periodEnd, and employeeIds are required' };
    }
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);
    const payrun = await prisma.payrun.create({
      data: {
        name, salaryStructureId, departmentId,
        periodStart: periodStartDate, periodEnd: periodEndDate,
        status: 'DRAFT', createdById: authUser.userId, notes,
        employees: { create: employeeIds.map((eid: string) => ({ employeeId: eid })) },
      },
      include: { employees: true, salaryStructure: true },
    });

    const warnings: any[] = [];
    for (const empLink of payrun.employees) {
      const emp = await prisma.employee.findUnique({ where: { id: empLink.employeeId } });
      if (!emp?.bankName || !emp?.bankAccountNo) {
        warnings.push({
          payrunId: payrun.id, severity: 'WARNING' as const,
          code: 'MISSING_BANK_DETAILS',
          message: `Employee ${emp?.firstName} ${emp?.lastName} is missing bank details`,
        });
      }
    }
    if (warnings.length > 0) {
      await prisma.payrollWarning.createMany({ data: warnings });
    }

    await createAuditLog({
      action: 'CREATE', module: 'PAYRUN', recordId: payrun.id,
      details: `Created payrun ${name} with ${employeeIds.length} employees for period ${periodStart} to ${periodEnd}`,
      userId: authUser.userId,
    });
    return this.getPayrunById(payrun.id);
  }

  async computePayrun(id: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        employees: true,
        salaryStructure: {
          include: { rules: { orderBy: { sequence: 'asc' }, include: { salaryRule: true } } },
        },
      },
    });
    if (!payrun) throw { status: 404, message: 'Payrun not found' };
    if (payrun.status === 'PAID') throw { status: 400, message: 'Cannot recompute a paid payrun' };

    const existingPayslips = await prisma.payslip.findMany({ where: { payrunId: id } });
    if (existingPayslips.length > 0) {
      await prisma.payslipLine.deleteMany({ where: { payslipId: { in: existingPayslips.map(p => p.id) } } });
      await prisma.payrollWarning.deleteMany({ where: { payslipId: { in: existingPayslips.map(p => p.id) } } });
      await prisma.payslip.deleteMany({ where: { payrunId: id } });
    }
    await prisma.payrollWarning.deleteMany({ where: { payrunId: id, payslipId: null } });

    const payslipsData: any[] = [];
    const allWarnings: any[] = [];
    const periodDays = this.daysBetween(payrun.periodStart, payrun.periodEnd) + 1;

    for (const link of payrun.employees) {
      const employeeId = link.employeeId;
      const contract = await prisma.contract.findFirst({
        where: {
          employeeId, status: 'ACTIVE',
          salaryStructureId: payrun.salaryStructureId,
          startDate: { lte: payrun.periodEnd },
          OR: [{ endDate: null }, { endDate: { gte: payrun.periodStart } }],
        },
      });

      if (!contract) {
        allWarnings.push({
          payrunId: id, severity: 'ERROR' as const,
          code: 'NO_ACTIVE_CONTRACT',
          message: `Employee ${employeeId} has no active contract for this period`,
        });
        continue;
      }

      const duplicate = await prisma.payslip.findFirst({
        where: {
          employeeId,
          periodStart: { lte: payrun.periodEnd },
          periodEnd: { gte: payrun.periodStart },
          payrunId: { not: id },
        },
      });
      if (duplicate) {
        allWarnings.push({
          payrunId: id, severity: 'WARNING' as const, code: 'DUPLICATE_PAYSLIP',
          message: `Employee ${employeeId} already has payslip for overlapping period`,
        });
      }

      const workedDays = await this.calculateWorkedDays(employeeId, payrun.periodStart, payrun.periodEnd);
      const computation = salaryService.computeSalaryLineItems(contract, payrun.salaryStructure, { workedDays, periodDays });

      const payslipWarnings: any[] = [];
      const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!emp?.bankName || !emp?.bankAccountNo) {
        payslipWarnings.push({
          severity: 'WARNING' as const, code: 'MISSING_BANK_DETAILS',
          message: 'Missing bank details for payment processing',
        });
      }
      if (workedDays < periodDays * 0.8) {
        payslipWarnings.push({
          severity: 'INFO' as const, code: 'LOW_ATTENDANCE',
          message: `Worked ${workedDays} of ${periodDays} period days - proration applied`,
        });
      }

      payslipsData.push({
        payrunId: id, employeeId, contractId: contract.id,
        salaryStructureId: payrun.salaryStructureId,
        periodStart: payrun.periodStart, periodEnd: payrun.periodEnd,
        status: 'COMPUTED', workedDays,
        basicAmount: computation.basicAmount,
        allowanceAmount: computation.allowanceAmount,
        deductionAmount: computation.deductionAmount,
        grossAmount: computation.grossAmount,
        netAmount: computation.netAmount,
        computedAt: new Date(),
        lines: computation.lines,
        warnings: payslipWarnings,
      });
    }

    for (const pData of payslipsData) {
      const { lines, warnings: ws, ...payslipFields } = pData;
      const payslip = await prisma.payslip.create({ data: payslipFields });
      if (lines.length > 0) {
        await prisma.payslipLine.createMany({
          data: lines.map((l: any) => ({ ...l, payslipId: payslip.id })),
        });
      }
      if (ws.length > 0) {
        await prisma.payrollWarning.createMany({
          data: ws.map((w: any) => ({ ...w, payslipId: payslip.id, payrunId: id })),
        });
      }
    }

    if (allWarnings.length > 0) {
      await prisma.payrollWarning.createMany({ data: allWarnings });
    }

    const updated = await prisma.payrun.update({
      where: { id }, data: { status: 'COMPUTED', computedAt: new Date() },
    });

    await createAuditLog({
      action: 'COMPUTE', module: 'PAYRUN', recordId: id,
      details: `Computed payrun ${updated.name} - generated ${payslipsData.length} payslips`,
      userId: authUser.userId,
    });
    return this.getPayrunById(id);
  }

  async validatePayrun(id: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({ where: { id } });
    if (!payrun) throw { status: 404, message: 'Payrun not found' };
    if (payrun.status !== 'COMPUTED') {
      throw { status: 400, message: 'Payrun must be computed before validation' };
    }
    const payslipCount = await prisma.payslip.count({ where: { payrunId: id } });
    if (payslipCount === 0) throw { status: 400, message: 'No payslips generated for this payrun' };

    await prisma.payrun.update({ where: { id }, data: { status: 'VALIDATED', validatedAt: new Date() } });
    await prisma.payslip.updateMany({ where: { payrunId: id }, data: { status: 'VALIDATED', validatedAt: new Date() } });

    await createAuditLog({
      action: 'VALIDATE', module: 'PAYRUN', recordId: id,
      details: `Validated payrun with ${payslipCount} payslips`,
      userId: authUser.userId,
    });
    return this.getPayrunById(id);
  }

  async markPayrunPaid(id: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({ where: { id } });
    if (!payrun) throw { status: 404, message: 'Payrun not found' };
    if (payrun.status !== 'VALIDATED') throw { status: 400, message: 'Payrun must be validated first' };

    await prisma.payrun.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
    await prisma.payslip.updateMany({
      where: { payrunId: id },
      data: { status: 'PAID', paidAt: new Date(), paymentStatus: 'PAID' },
    });

    const count = await prisma.payslip.count({ where: { payrunId: id } });
    await createAuditLog({
      action: 'MARK_PAID', module: 'PAYRUN', recordId: id,
      details: `Marked ${count} payslips as paid`,
      userId: authUser.userId,
    });
    return this.getPayrunById(id);
  }

  // ========== PAYSLIPS ==========
  async getPayslipById(id: string) {
    return prisma.payslip.findUnique({
      where: { id },
      include: {
        payrun: { select: { id: true, name: true, status: true } },
        employee: {
          select: {
            id: true, firstName: true, lastName: true, employeeCode: true,
            email: true, phone: true, address: true, city: true,
            bankName: true, bankAccountNo: true, bankIFSC: true,
            avatarUrl: true,
          },
        },
        contract: {
          include: { department: true, workingSchedule: { include: { days: true } } },
        },
        salaryStructure: { select: { id: true, name: true, code: true } },
        lines: { orderBy: { sequence: 'asc' } },
        warnings: { orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }] },
        deliveries: true,
      },
    });
  }

  async getMyPayslips(employeeId: string) {
    return prisma.payslip.findMany({
      where: { employeeId },
      include: { payrun: { select: { id: true, name: true } } },
      orderBy: [{ periodStart: 'desc' }],
    });
  }

  async getPayslipsForPayrun(payrunId: string) {
    return prisma.payslip.findMany({
      where: { payrunId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
      },
      orderBy: [{ employee: { lastName: 'asc' } }],
    });
  }

  async sendPayslips(payrunId: string, authUser: AuthUser) {
    const payslips = await prisma.payslip.findMany({
      where: { payrunId, status: { in: ['VALIDATED', 'PAID'] } },
      include: { employee: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    const deliveries: any[] = [];
    for (const ps of payslips) {
      if (ps.employee.email) {
        deliveries.push({
          payslipId: ps.id,
          recipientEmail: ps.employee.email,
          status: 'SENT' as const,
          sentAt: new Date(),
        });
      }
    }
    if (deliveries.length > 0) {
      await prisma.payslipDelivery.createMany({ data: deliveries });
    }

    await createAuditLog({
      action: 'SEND_PAYSLIPS', module: 'PAYRUN', recordId: payrunId,
      details: `Queued delivery of ${deliveries.length} payslips via email`,
      userId: authUser.userId,
    });
    return { sent: deliveries.length, total: payslips.length };
  }

  // ========== HELPERS ==========
  private async aggregatePayrunSummary(payrunId: string) {
    const payslips = await prisma.payslip.findMany({
      where: { payrunId },
      select: {
        basicAmount: true, allowanceAmount: true, deductionAmount: true,
        grossAmount: true, netAmount: true,
      },
    });
    const sum = (key: string) => payslips.reduce((s: number, p: any) => s + Number(p[key] || 0), 0);
    return {
      totalBasic: Number(sum('basicAmount').toFixed(2)),
      totalAllowances: Number(sum('allowanceAmount').toFixed(2)),
      totalDeductions: Number(sum('deductionAmount').toFixed(2)),
      totalGross: Number(sum('grossAmount').toFixed(2)),
      totalNet: Number(sum('netAmount').toFixed(2)),
      averageNet: payslips.length > 0 ? Number((sum('netAmount') / payslips.length).toFixed(2)) : 0,
    };
  }

  private async calculateWorkedDays(employeeId: string, start: Date, end: Date) {
    const records = await prisma.attendance.count({
      where: {
        employeeId,
        workDate: { gte: start, lte: end },
        status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] },
      },
    });
    return records;
  }

  private daysBetween(start: Date, end: Date) {
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}

export const payrollService = new PayrollService();
