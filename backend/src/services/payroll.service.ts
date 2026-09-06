import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';
import { payrollInputsService } from './payroll-inputs.service';
import { ruleEngine } from './rule-engine.service';
import { PayrollWarningInput } from '../types';

export class PayrollService {
  // ══════════════════════════════════════════════
  //  PAYRUNS
  // ══════════════════════════════════════════════

  async getAllPayruns(filters: {
    status?: string;
    salaryStructureId?: string;
    departmentId?: string;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.salaryStructureId) where.salaryStructureId = filters.salaryStructureId;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    return prisma.payrun.findMany({
      where,
      include: {
        salaryStructure: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        _count: { select: { payslips: true, employees: true, warnings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayrunById(id: string) {
    return prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                email: true,
                bankName: true,
                bankAccountNo: true,
              },
            },
            contract: {
              select: {
                id: true,
                wage: true,
                jobPosition: true,
                department: { select: { id: true, name: true } },
              },
            },
            lines: { orderBy: { sequence: 'asc' } },
            warnings: true,
          },
          orderBy: { employee: { firstName: 'asc' } },
        },
        warnings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getEligibleEmployeesForPayrun(
    salaryStructureId: string,
    periodStart: string,
    periodEnd: string,
    departmentId?: string
  ) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Find employees with active contracts linked to this salary structure
    const where: any = {
      status: 'ACTIVE',
      contracts: {
        some: {
          status: 'ACTIVE',
          salaryStructureId,
          startDate: { lte: end },
          OR: [{ endDate: { gte: start } }, { endDate: null }],
        },
      },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        contracts: {
          where: {
            status: 'ACTIVE',
            salaryStructureId,
            startDate: { lte: end },
            OR: [{ endDate: { gte: start } }, { endDate: null }],
          },
          select: {
            id: true,
            wage: true,
            currencyCode: true,
            jobPosition: true,
            department: { select: { id: true, name: true } },
          },
          take: 1,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return employees.map((emp) => ({
      ...emp,
      contract: emp.contracts[0] || null,
      contracts: undefined,
    }));
  }

  async createPayrunStep1(data: any, authUser: AuthUser) {
    const { salaryStructureId, periodStart, periodEnd, departmentId } = data;

    const structure = await prisma.salaryStructure.findUnique({
      where: { id: salaryStructureId },
      include: {
        rules: {
          include: { salaryRule: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!structure || !structure.isActive) {
      throw { status: 400, message: 'Salary structure not found or inactive' };
    }

    const eligible = await this.getEligibleEmployeesForPayrun(
      salaryStructureId,
      periodStart,
      periodEnd,
      departmentId
    );

    return {
      structure: {
        id: structure.id,
        name: structure.name,
        rulesCount: structure.rules.length,
        rules: structure.rules.map((r) => ({
          code: r.salaryRule.code,
          name: r.salaryRule.name,
          category: r.salaryRule.category,
          sequence: r.sequence,
        })),
      },
      period: { start: periodStart, end: periodEnd },
      eligibleEmployees: eligible,
      eligibleCount: eligible.length,
    };
  }

  async createPayrun(data: any, authUser: AuthUser) {
    const { name, salaryStructureId, periodStart, periodEnd, departmentId, employeeIds } = data;

    // Check duplicate name
    const existing = await prisma.payrun.findUnique({ where: { name } });
    if (existing) {
      throw { status: 409, message: 'A payrun with this name already exists' };
    }

    const payrun = await prisma.payrun.create({
      data: {
        name,
        salaryStructureId,
        departmentId: departmentId || null,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: 'DRAFT',
        createdById: authUser.userId,
        employees: {
          create: employeeIds.map((empId: string) => ({
            employeeId: empId,
          })),
        },
      },
      include: {
        employees: true,
        _count: { select: { employees: true } },
      },
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'PAYRUN',
      recordId: payrun.id,
      details: `Created payrun "${name}" with ${employeeIds.length} employees`,
      userId: authUser.userId,
    });

    return payrun;
  }

  // ══════════════════════════════════════════════
  //  COMPUTE PAYRUN (THE MAIN ENGINE)
  // ══════════════════════════════════════════════

  async computePayrun(payrunId: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        salaryStructure: {
          include: {
            rules: {
              include: { salaryRule: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                email: true,
                bankName: true,
                bankAccountNo: true,
              },
            },
          },
        },
      },
    });

    if (!payrun) {
      throw { status: 404, message: 'Payrun not found' };
    }

    if (payrun.status === 'PAID') {
      throw { status: 400, message: 'Cannot recompute a paid payrun' };
    }

    const periodStart = payrun.periodStart;
    const periodEnd = payrun.periodEnd;
    const rules = payrun.salaryStructure.rules;
    const allWarnings: PayrollWarningInput[] = [];

    // Delete existing payslips, deliveries & warnings if recomputing
    await prisma.payslipLine.deleteMany({
      where: { payslip: { payrunId } },
    });
    await prisma.payslipDelivery.deleteMany({
      where: { payslip: { payrunId } },
    });
    await prisma.payslip.deleteMany({ where: { payrunId } });
    await prisma.payrollWarning.deleteMany({ where: { payrunId } });

    // Process each employee
    for (const pe of payrun.employees) {
      const employee = pe.employee;

      // ── Build payroll inputs ──
      const inputs = await payrollInputsService.buildInputs(
        employee.id,
        periodStart,
        periodEnd
      );

      if (!inputs) {
        allWarnings.push({
          payrunId,
          severity: 'ERROR',
          code: 'NO_ACTIVE_CONTRACT',
          message: `${employee.firstName} ${employee.lastName} (${employee.employeeCode}): No active contract found for this period`,
        });
        continue;
      }

      // ── Detect warnings ──
      if (!employee.bankAccountNo) {
        allWarnings.push({
          payrunId,
          severity: 'WARNING',
          code: 'NO_BANK_DETAILS',
          message: `${employee.firstName} ${employee.lastName}: Missing bank account details`,
        });
      }

      if (inputs.missingCheckouts > 0) {
        allWarnings.push({
          payrunId,
          severity: 'ERROR',
          code: 'MISSING_CHECKOUT',
          message: `${employee.firstName} ${employee.lastName}: ${inputs.missingCheckouts} missing checkout(s) in this period. Please correct attendance before finalizing.`,
        });
      }

      if (inputs.absentDays > 3) {
        allWarnings.push({
          payrunId,
          severity: 'INFO',
          code: 'HIGH_ABSENTEEISM',
          message: `${employee.firstName} ${employee.lastName}: ${inputs.absentDays} absent days this period`,
        });
      }

      if (inputs.unpaidLeaveDays > 0) {
        allWarnings.push({
          payrunId,
          severity: 'INFO',
          code: 'UNPAID_LEAVE',
          message: `${employee.firstName} ${employee.lastName}: ${inputs.unpaidLeaveDays} unpaid leave day(s) — salary will be deducted`,
        });
      }

      // ── Execute Rule Engine ──
      const result = ruleEngine.execute(inputs, rules);

      // ── Create Payslip ──
      const payslip = await prisma.payslip.create({
        data: {
          payrunId,
          employeeId: employee.id,
          contractId: inputs.contractId,
          salaryStructureId: payrun.salaryStructureId,
          periodStart,
          periodEnd,
          status: 'COMPUTED',
          paymentStatus: 'PENDING',
          workedDays: inputs.workedDays,
          basicAmount: result.basicAmount,
          allowanceAmount: result.allowanceAmount,
          deductionAmount: result.deductionAmount,
          grossAmount: result.grossAmount,
          netAmount: result.netAmount,
          computedAt: new Date(),
          lines: {
            create: result.lines.map((line) => ({
              salaryRuleId: line.salaryRuleId,
              code: line.code,
              name: line.name,
              category: line.category as any,
              sequence: line.sequence,
              amount: line.amount,
              explanation: line.explanation,
            })),
          },
        },
      });

      // Attach payslip-level warnings
      for (const w of allWarnings.filter((w) => !w.payslipId)) {
        if (w.message.includes(employee.employeeCode) || w.message.includes(employee.firstName)) {
          w.payslipId = payslip.id;
        }
      }
    }

    // ── Save all warnings ──
    if (allWarnings.length > 0) {
      await prisma.payrollWarning.createMany({
        data: allWarnings.map((w) => ({
          payrunId: w.payrunId || payrunId,
          payslipId: w.payslipId || null,
          severity: w.severity as any,
          code: w.code,
          message: w.message,
        })),
      });
    }

    // ── Update payrun status ──
    const updated = await prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'COMPUTED',
        computedAt: new Date(),
      },
      include: {
        payslips: {
          include: {
            employee: {
              select: { employeeCode: true, firstName: true, lastName: true },
            },
            lines: { orderBy: { sequence: 'asc' } },
          },
        },
        warnings: true,
        _count: { select: { payslips: true, warnings: true } },
      },
    });

    await createAuditLog({
      action: 'COMPUTE',
      module: 'PAYRUN',
      recordId: payrunId,
      details: `Computed ${updated.payslips.length} payslips with ${allWarnings.length} warnings`,
      userId: authUser.userId,
    });

    return updated;
  }

  // ══════════════════════════════════════════════
  //  VALIDATE & PAID
  // ══════════════════════════════════════════════

  async validatePayrun(payrunId: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: { warnings: { where: { isResolved: false } } },
    });

    if (!payrun) throw { status: 404, message: 'Payrun not found' };
    if (payrun.status !== 'COMPUTED') {
      throw { status: 400, message: 'Payrun must be computed before validation' };
    }

    const unresolvedErrors = payrun.warnings.filter(
      (w) => w.severity === 'ERROR' && !w.isResolved
    );

    if (unresolvedErrors.length > 0) {
      throw {
        status: 400,
        message: `Cannot validate: ${unresolvedErrors.length} unresolved error(s). Please fix attendance/contract issues first.`,
      };
    }

    const updated = await prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
    });

    await prisma.payslip.updateMany({
      where: { payrunId },
      data: { status: 'VALIDATED', validatedAt: new Date() },
    });

    await createAuditLog({
      action: 'VALIDATE',
      module: 'PAYRUN',
      recordId: payrunId,
      details: 'Payrun validated',
      userId: authUser.userId,
    });

    return updated;
  }

  async markPayrunPaid(payrunId: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });

    if (!payrun) throw { status: 404, message: 'Payrun not found' };
    if (payrun.status !== 'VALIDATED') {
      throw { status: 400, message: 'Payrun must be validated before marking as paid' };
    }

    const updated = await prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    await prisma.payslip.updateMany({
      where: { payrunId },
      data: { status: 'PAID', paymentStatus: 'PAID', paidAt: new Date() },
    });

    await createAuditLog({
      action: 'PAID',
      module: 'PAYRUN',
      recordId: payrunId,
      details: 'Payrun marked as paid',
      userId: authUser.userId,
    });

    return updated;
  }

  async sendPayslips(payrunId: string, authUser: AuthUser) {
    const payslips = await prisma.payslip.findMany({
      where: { payrunId },
      include: {
        employee: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const slip of payslips) {
      try {
        // In production: integrate with email service (SendGrid, SES, etc.)
        // For now: create delivery record
        await prisma.payslipDelivery.create({
          data: {
            payslipId: slip.id,
            recipientEmail: slip.employee.email,
            status: 'QUEUED',
          },
        });
        sent++;
      } catch {
        failed++;
      }
    }

    await createAuditLog({
      action: 'SEND_PAYSLIPS',
      module: 'PAYRUN',
      recordId: payrunId,
      details: `Sent ${sent} payslip emails, ${failed} failed`,
      userId: authUser.userId,
    });

    return { sent, failed, total: payslips.length };
  }

  // ══════════════════════════════════════════════
  //  PAYSLIPS
  // ══════════════════════════════════════════════

  async getPayslipById(id: string) {
    return prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            bankName: true,
            bankAccountNo: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            wage: true,
            department: { select: { id: true, name: true } },
          },
        },
        salaryStructure: { select: { id: true, name: true } },
        payrun: { select: { id: true, name: true } },
        lines: { orderBy: { sequence: 'asc' } },
        warnings: { orderBy: { createdAt: 'desc' } },
        deliveries: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getMyPayslips(employeeId: string) {
    return prisma.payslip.findMany({
      where: { employeeId },
      include: {
        payrun: { select: { id: true, name: true } },
        salaryStructure: { select: { id: true, name: true } },
        lines: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getPayslipsForPayrun(payrunId: string) {
    return prisma.payslip.findMany({
      where: { payrunId },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lines: { orderBy: { sequence: 'asc' } },
        warnings: true,
      },
      orderBy: { employee: { firstName: 'asc' } },
    });
  }

  async deletePayrun(payrunId: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
    if (!payrun) throw { status: 404, message: 'Payrun not found' };
    if (payrun.status === 'PAID') {
      throw { status: 400, message: 'Cannot delete a paid payrun' };
    }

    await prisma.payslipLine.deleteMany({
      where: { payslip: { payrunId } },
    });
    await prisma.payslip.deleteMany({ where: { payrunId } });
    await prisma.payrollWarning.deleteMany({ where: { payrunId } });
    await prisma.payrunEmployee.deleteMany({ where: { payrunId } });
    await prisma.payrun.delete({ where: { id: payrunId } });

    await createAuditLog({
      action: 'DELETE',
      module: 'PAYRUN',
      recordId: payrunId,
      details: `Deleted payrun "${payrun.name}"`,
      userId: authUser.userId,
    });
  }
}

export const payrollService = new PayrollService();