import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export class DashboardService {
  async getPayrollDashboard(filters: { periodStart?: string; periodEnd?: string; departmentId?: string; employeeType?: string }) {
    const wherePeriod: any = {};
    if (filters.periodStart) wherePeriod.periodStart = { gte: new Date(filters.periodStart) };
    if (filters.periodEnd) wherePeriod.periodEnd = { lte: new Date(filters.periodEnd) };

    const paidPayslipsWhere: any = { ...wherePeriod, paymentStatus: 'PAID' };
    if (filters.departmentId || filters.employeeType) {
      paidPayslipsWhere.employee = {};
      if (filters.departmentId) paidPayslipsWhere.employee.contracts = { some: { departmentId: filters.departmentId } };
      if (filters.employeeType) paidPayslipsWhere.employee.employeeType = filters.employeeType;
    }

    const payslipAgg = await prisma.payslip.aggregate({
      where: paidPayslipsWhere,
      _sum: { netAmount: true, grossAmount: true, basicAmount: true, allowanceAmount: true, deductionAmount: true },
      _avg: { netAmount: true },
      _count: true,
    });

    const allPayslipsWhere: any = { ...wherePeriod };
    if (filters.departmentId || filters.employeeType) {
      allPayslipsWhere.employee = {};
      if (filters.departmentId) allPayslipsWhere.employee.contracts = { some: { departmentId: filters.departmentId } };
      if (filters.employeeType) allPayslipsWhere.employee.employeeType = filters.employeeType;
    }
    const payslipCount = await prisma.payslip.count({ where: allPayslipsWhere });

    const approvedLeaveWhere: any = { status: 'APPROVED' };
    if (filters.periodStart) approvedLeaveWhere.startDate = { gte: new Date(filters.periodStart) };
    if (filters.periodEnd) approvedLeaveWhere.endDate = { lte: new Date(filters.periodEnd) };
    const approvedLeaves = await prisma.leaveRequest.count({ where: approvedLeaveWhere });

    const attendanceRange: any = {};
    if (filters.periodStart) attendanceRange.workDate = { gte: new Date(filters.periodStart) };
    if (filters.periodEnd) attendanceRange.workDate = { ...(attendanceRange.workDate || {}), lte: new Date(filters.periodEnd) };

    const attendanceAgg = await prisma.attendance.groupBy({
      by: ['status'],
      where: attendanceRange,
      _count: true,
    });
    const attMap: Record<string, number> = {};
    for (const a of attendanceAgg) attMap[a.status] = a._count;
    const totalAtt = Object.values(attMap).reduce((s, n) => s + n, 0);
    const presentCount = (attMap['PRESENT'] || 0) + (attMap['LATE'] || 0) + (attMap['HALF_DAY'] || 0);
    const attendanceHealth = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

    const lateCount = attMap['LATE'] || 0;
    const absentCount = attMap['ABSENT'] || 0;
    const missingCheckout = await prisma.attendance.count({
      where: { ...attendanceRange, checkOut: null, status: { notIn: ['ABSENT', 'HOLIDAY', 'WEEKEND', 'ON_LEAVE'] } },
    });
    const manualEdits = await prisma.attendance.count({ where: { ...attendanceRange, isManualEdit: true } });

    const overtimeAgg = await prisma.attendance.aggregate({
      where: { ...attendanceRange, overtimeMinutes: { gt: 0 } },
      _sum: { overtimeMinutes: true },
      _count: true,
    });

    const pendingLeaveCount = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });

    const payrollWarnings = await prisma.payrollWarning.findMany({
      where: { isResolved: false },
      take: 10,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        payslip: { include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } } },
      },
    });

    const pendingContracts = await prisma.contract.count({ where: { status: 'DRAFT' } });

    const psStart = filters.periodStart ? new Date(filters.periodStart) : new Date('2000-01-01');
    const psEnd = filters.periodEnd ? new Date(filters.periodEnd) : new Date('2100-12-31');

    const departmentCost = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT d.id, d.name, d.code,
        COALESCE(SUM(ps."netAmount"),0) as total_net,
        COUNT(DISTINCT ps."employeeId") as headcount
      FROM departments d
      LEFT JOIN contracts c ON c."departmentId" = d.id AND c.status = 'ACTIVE'
      LEFT JOIN payslips ps ON ps."contractId" = c.id
        AND ps."periodStart" >= ${psStart}
        AND ps."periodEnd" <= ${psEnd}
      GROUP BY d.id, d.name, d.code
      ORDER BY total_net DESC`
    );

    const monthlyTrend = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT to_char(date_trunc('month', "periodStart"), 'YYYY-MM') as month,
        SUM("netAmount") as total_net,
        COUNT(*) as payslip_count
      FROM payslips
      WHERE "paymentStatus" = 'PAID'
      GROUP BY date_trunc('month', "periodStart")
      ORDER BY month DESC
      LIMIT 12`
    );

    const activeContracts = await prisma.contract.count({ where: { status: 'ACTIVE' } });
    const activeEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });

    return {
      kpis: {
        totalNetPaid: Number(payslipAgg._sum.netAmount || 0),
        totalGross: Number(payslipAgg._sum.grossAmount || 0),
        totalBasic: Number(payslipAgg._sum.basicAmount || 0),
        totalAllowances: Number(payslipAgg._sum.allowanceAmount || 0),
        totalDeductions: Number(payslipAgg._sum.deductionAmount || 0),
        averageSalary: Number(payslipAgg._avg.netAmount || 0),
        paidPayslips: payslipAgg._count || 0,
        payslipsGenerated: payslipCount,
        approvedTimeOffDays: approvedLeaves,
        attendanceHealth,
        activeEmployees,
        activeContracts,
      },
      attendanceOverview: {
        totalRecords: totalAtt,
        present: attMap['PRESENT'] || 0,
        late: lateCount,
        absent: absentCount,
        halfDay: attMap['HALF_DAY'] || 0,
        onLeave: attMap['ON_LEAVE'] || 0,
        holiday: attMap['HOLIDAY'] || 0,
        weekend: attMap['WEEKEND'] || 0,
        missingCheckout,
        manualEdits,
        overtimeMinutes: Number(overtimeAgg._sum.overtimeMinutes || 0),
        overtimeRecords: overtimeAgg._count || 0,
        coveragePercent: totalAtt > 0 ? Math.round((presentCount / Math.max(1, totalAtt)) * 100) : 0,
      },
      timeOffOverview: {
        pendingRequests: pendingLeaveCount,
        approvedDays: approvedLeaves,
      },
      alerts: {
        payrollWarnings: payrollWarnings.length,
        pendingContracts,
        unresolvedWarnings: payrollWarnings,
      },
      salaryCostByDepartment: departmentCost.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        totalNet: Number(d.total_net || 0),
        headcount: Number(d.headcount || 0),
      })),
      monthlyNetTrend: monthlyTrend.reverse().map(m => ({
        month: m.month,
        totalNet: Number(m.total_net || 0),
        payslipCount: Number(m.payslip_count || 0),
      })),
    };
  }
}

export const dashboardService = new DashboardService();
