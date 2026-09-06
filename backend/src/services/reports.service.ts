import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

export class ReportsService {
  /**
   * Get aggregated payroll summary report across payruns, periods, and departments.
   */
  async getPayrollSummary(filters: {
    periodStart?: string;
    periodEnd?: string;
    departmentId?: string;
    payrunId?: string;
  }) {
    const where: any = {};

    if (filters.payrunId) {
      where.payrunId = filters.payrunId;
    }
    if (filters.departmentId) {
      where.contract = { departmentId: filters.departmentId };
    }
    if (filters.periodStart && filters.periodEnd) {
      where.periodStart = { gte: new Date(filters.periodStart) };
      where.periodEnd = { lte: new Date(filters.periodEnd) };
    }

    const payslips = await prisma.payslip.findMany({
      where,
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
        contract: {
          select: {
            department: { select: { id: true, name: true } },
          },
        },
        payrun: { select: { id: true, name: true, status: true } },
        lines: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { periodStart: 'desc' },
    });

    // Aggregated Metrics
    const totalPayslips = payslips.length;
    let totalGross = 0;
    let totalNet = 0;
    let totalBasic = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;

    const departmentTotals: Record<string, { id: string; name: string; gross: number; net: number; count: number }> = {};
    const categoryTotals: Record<string, number> = {
      BASIC: 0,
      ALLOWANCE: 0,
      DEDUCTION: 0,
      EMPLOYER_CONTRIBUTION: 0,
    };

    for (const p of payslips) {
      const gross = Number(p.grossAmount || 0);
      const net = Number(p.netAmount || 0);
      const basic = Number(p.basicAmount || 0);
      const allow = Number(p.allowanceAmount || 0);
      const ded = Number(p.deductionAmount || 0);

      totalGross += gross;
      totalNet += net;
      totalBasic += basic;
      totalAllowances += allow;
      totalDeductions += ded;

      // Department breakdown
      const deptName = p.contract?.department?.name || 'Unassigned';
      const deptId = p.contract?.department?.id || 'unassigned';
      if (!departmentTotals[deptId]) {
        departmentTotals[deptId] = { id: deptId, name: deptName, gross: 0, net: 0, count: 0 };
      }
      departmentTotals[deptId].gross += gross;
      departmentTotals[deptId].net += net;
      departmentTotals[deptId].count += 1;

      // Line item category breakdown
      for (const line of p.lines) {
        const cat = line.category;
        const amt = Number(line.amount || 0);
        if (categoryTotals[cat] !== undefined) {
          categoryTotals[cat] += amt;
        } else {
          categoryTotals[cat] = amt;
        }
      }
    }

    return {
      summary: {
        totalPayslips,
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalBasic: Math.round(totalBasic * 100) / 100,
        totalAllowances: Math.round(totalAllowances * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
      },
      categoryBreakdown: categoryTotals,
      departmentBreakdown: Object.values(departmentTotals),
      payslipsCount: totalPayslips,
    };
  }

  /**
   * Get employee payslips list for reporting & export.
   */
  async getEmployeePayslipsReport(filters: {
    payrunId?: string;
    departmentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters.payrunId) where.payrunId = filters.payrunId;
    if (filters.departmentId) where.contract = { departmentId: filters.departmentId };
    if (filters.startDate && filters.endDate) {
      where.periodStart = { gte: new Date(filters.startDate) };
      where.periodEnd = { lte: new Date(filters.endDate) };
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { employee: { firstName: { contains: q, mode: 'insensitive' } } },
        { employee: { lastName: { contains: q, mode: 'insensitive' } } },
        { employee: { employeeCode: { contains: q, mode: 'insensitive' } } },
      ];
    }

    return prisma.payslip.findMany({
      where,
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
            wage: true,
            currencyCode: true,
            jobPosition: true,
            department: { select: { id: true, name: true } },
          },
        },
        salaryStructure: { select: { id: true, name: true, code: true } },
        payrun: { select: { id: true, name: true, status: true } },
        lines: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  /**
   * Generate structured HTML/PDF Payslip with embedded SVG logo & Salary Tree breakdown.
   */
  async generatePayslipHTML(payslipId: string) {
    const p = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        employee: true,
        contract: {
          include: { department: true },
        },
        salaryStructure: { select: { id: true, name: true, code: true } },
        payrun: { select: { id: true, name: true, periodStart: true, periodEnd: true } },
        lines: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!p) throw { status: 404, message: 'Payslip not found' };

    const emp = p.employee;
    const lines = p.lines || [];

    // Group components into structured Salary Tree
    const basicLines = lines.filter((l) => l.category === 'BASIC');
    const allowanceLines = lines.filter((l) => l.category === 'ALLOWANCE');
    const deductionLines = lines.filter((l) => l.category === 'DEDUCTION');
    const employerLines = lines.filter((l) => l.category === 'EMPLOYER_CONTRIBUTION');

    const fmt = (n: number | any) =>
      `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dateFmt = (d: any) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

    // Convert number to Indian rupees words (simple representation)
    const numToWords = (num: number): string => {
      const n = Math.round(num);
      return `Rupees ${n.toLocaleString('en-IN')} Only`;
    };

    const logoSVG = `
      <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="24" fill="url(#brand_grad)"/>
        <path d="M30 35C30 32.2386 32.2386 30 35 30H65C67.7614 30 70 32.2386 70 35V65C70 67.7614 67.7614 70 65 70H35C32.2386 70 30 67.7614 30 65V35Z" stroke="white" stroke-width="6"/>
        <circle cx="50" cy="50" r="14" fill="#60A5FA"/>
        <path d="M50 40V60M40 50H60" stroke="white" stroke-width="5" stroke-linecap="round"/>
        <defs>
          <linearGradient id="brand_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1E3A8A"/>
            <stop offset="1" stop-color="#2563EB"/>
          </linearGradient>
        </defs>
      </svg>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payslip - ${emp.employeeCode} - ${emp.firstName} ${emp.lastName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 30px 15px;
      font-size: 13px;
    }
    .payslip-card {
      max-width: 880px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 32px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .brand-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .status-badge {
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge-PAID { background: #dcfce7; color: #15803d; }
    .badge-VALIDATED { background: #e0e7ff; color: #4338ca; }
    .badge-COMPUTED { background: #fef3c7; color: #b45309; }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 32px 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-group h4 {
      margin: 0 0 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      font-weight: 700;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 6px 0;
      font-size: 12.5px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .info-table td.label { color: #64748b; }
    .info-table td.val { font-weight: 700; text-align: right; color: #0f172a; }

    /* Salary Component Tree */
    .tree-section {
      padding: 32px 40px;
    }
    .tree-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tree-root {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 14px 20px;
      font-weight: 800;
      font-size: 14px;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .tree-branch {
      margin-left: 20px;
      padding-left: 16px;
      border-left: 2px dashed #cbd5e1;
      margin-bottom: 16px;
    }
    .branch-header {
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 6px 0;
      color: #3b82f6;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .branch-header.deduction { color: #ef4444; }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-top: 6px;
      font-size: 12.5px;
    }
    .item-row .code {
      font-family: monospace;
      font-size: 11px;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 8px;
      color: #475569;
    }
    .item-row .amt { font-weight: 700; color: #0f172a; }
    .item-row .amt.ded { color: #dc2626; }
    .explanation-text {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      font-family: monospace;
    }

    /* Net Pay Box */
    .net-box {
      margin: 0 40px 32px;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      padding: 24px 32px;
      border-radius: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.3);
    }
    .net-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      opacity: 0.9;
    }
    .net-amount {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: -1px;
      margin-top: 4px;
    }
    .net-words {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 4px;
      font-style: italic;
    }

    .footer {
      padding: 20px 40px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="payslip-card">
    <div class="header">
      <div class="brand-box">
        ${logoSVG}
        <div>
          <div class="brand-title">PeoplePay360</div>
          <div class="brand-sub">Official Payroll & Compensation Statement</div>
        </div>
      </div>
      <span class="status-badge badge-${p.status}">${p.status}</span>
    </div>

    <div class="details-grid">
      <div class="info-group">
        <h4>Employee Metadata</h4>
        <table class="info-table">
          <tr><td class="label">Employee Code</td><td class="val">${emp.employeeCode}</td></tr>
          <tr><td class="label">Employee Name</td><td class="val">${emp.firstName} ${emp.lastName}</td></tr>
          <tr><td class="label">Department</td><td class="val">${p.contract?.department?.name || '-'}</td></tr>
          <tr><td class="label">Job Designation</td><td class="val">${p.contract?.jobPosition || 'Staff'}</td></tr>
          <tr><td class="label">Email Address</td><td class="val">${emp.email}</td></tr>
        </table>
      </div>

      <div class="info-group">
        <h4>Pay Period & Banking</h4>
        <table class="info-table">
          <tr><td class="label">Pay Statement ID</td><td class="val">#${p.id.slice(-8).toUpperCase()}</td></tr>
          <tr><td class="label">Pay Period</td><td class="val">${dateFmt(p.periodStart)} – ${dateFmt(p.periodEnd)}</td></tr>
          <tr><td class="label">Salary Structure</td><td class="val">${p.salaryStructure?.name || '-'}</td></tr>
          <tr><td class="label">Bank Name</td><td class="val">${emp.bankName || 'Direct Transfer'}</td></tr>
          <tr><td class="label">Account Number</td><td class="val">${emp.bankAccountNo ? '•••• ' + emp.bankAccountNo.slice(-4) : '-'}</td></tr>
        </table>
      </div>
    </div>

    <div class="tree-section">
      <div class="tree-title">
        <span>Structured Component Tree Breakdown</span>
      </div>

      <div class="tree-root">
        <span>Regular Salary Breakdown</span>
        <span>${fmt(p.grossAmount)} (Gross)</span>
      </div>

      <div class="tree-branch">
        <div class="branch-header">├── Basic Salary Component</div>
        ${basicLines.map((l) => `
          <div class="item-row">
            <div>
              <span class="code">${l.code}</span>
              <strong>${l.name}</strong>
              ${l.explanation ? `<div class="explanation-text">${l.explanation}</div>` : ''}
            </div>
            <span class="amt">${fmt(l.amount)}</span>
          </div>
        `).join('')}

        <div class="branch-header" style="margin-top:14px;">├── Allowances & Variable Components</div>
        ${allowanceLines.length === 0 ? '<div class="item-row"><span style="color:#94a3b8">None</span><span class="amt">₹0.00</span></div>' : allowanceLines.map((l) => `
          <div class="item-row">
            <div>
              <span class="code">${l.code}</span>
              <strong>${l.name}</strong>
              ${l.explanation ? `<div class="explanation-text">${l.explanation}</div>` : ''}
            </div>
            <span class="amt">${fmt(l.amount)}</span>
          </div>
        `).join('')}

        <div class="branch-header deduction" style="margin-top:14px;">└── Statutory Deductions & Tax (PF, Tax, Absences)</div>
        ${deductionLines.length === 0 ? '<div class="item-row"><span style="color:#94a3b8">No Deductions</span><span class="amt">₹0.00</span></div>' : deductionLines.map((l) => `
          <div class="item-row">
            <div>
              <span class="code">${l.code}</span>
              <strong>${l.name}</strong>
              ${l.explanation ? `<div class="explanation-text">${l.explanation}</div>` : ''}
            </div>
            <span class="amt ded">− ${fmt(l.amount)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="net-box">
      <div>
        <div class="net-title">Net Salary Payable</div>
        <div class="net-amount">${fmt(p.netAmount)}</div>
        <div class="net-words">${numToWords(Number(p.netAmount))}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px; opacity:0.9;">Gross: ${fmt(p.grossAmount)}</div>
        <div style="font-size:12px; opacity:0.9; margin-top:4px;">Deductions: − ${fmt(p.deductionAmount)}</div>
      </div>
    </div>

    <div class="footer">
      This statement is electronically generated by PeoplePay360 HR & Payroll Platform. Verified for payroll compliance.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Publish payslips to the website portal so employees can view them under My Payslips.
   */
  async publishToPortal(payrunId: string, authUser: AuthUser) {
    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: {
          include: {
            employee: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!payrun) throw { status: 404, message: 'Payrun not found' };

    let count = 0;
    for (const payslip of payrun.payslips) {
      await prisma.payslipDelivery.create({
        data: {
          payslipId: payslip.id,
          recipientEmail: payslip.employee.email,
          status: 'SENT',
        },
      });
      count++;
    }

    await createAuditLog({
      action: 'SEND_PAYSLIPS',
      module: 'REPORTS',
      recordId: payrunId,
      details: `Published ${count} payslips to Portal for payrun "${payrun.name}"`,
      userId: authUser.userId,
    });

    return { success: true, count, payrunName: payrun.name, method: 'PORTAL' };
  }

  /**
   * Mail payslips directly to employee emails using Nodemailer with attached HTML/PDF document.
   */
  async emailPayslipsWithNodemailer(payrunId: string, authUser: AuthUser) {
    const { emailService } = await import('./email.service');
    const { pdfGeneratorService } = await import('./pdf-generator.service');

    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!payrun) throw { status: 404, message: 'Payrun not found' };

    const results = await Promise.all(
      payrun.payslips.map(async (payslip) => {
        try {
          const html = await this.generatePayslipHTML(payslip.id);
          const pdfBuffer = await pdfGeneratorService.generatePayslipPDFBuffer(payslip.id);
          const periodStr = `${payrun.periodStart.toISOString().slice(0, 10)} to ${payrun.periodEnd.toISOString().slice(0, 10)}`;

          await emailService.sendPayslipEmail({
            to: payslip.employee.email,
            employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
            employeeCode: payslip.employee.employeeCode,
            periodName: periodStr,
            htmlContent: html,
            pdfBuffer: pdfBuffer,
          });

          await prisma.payslipDelivery.create({
            data: {
              payslipId: payslip.id,
              recipientEmail: payslip.employee.email,
              status: 'SENT',
            },
          });
          return { success: true };
        } catch (err) {
          console.error(`Failed to mail PDF payslip ${payslip.id} to ${payslip.employee.email}:`, err);
          await prisma.payslipDelivery.create({
            data: {
              payslipId: payslip.id,
              recipientEmail: payslip.employee.email,
              status: 'FAILED',
            },
          });
          return { success: false };
        }
      })
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await createAuditLog({
      action: 'SEND_PAYSLIPS',
      module: 'REPORTS',
      recordId: payrunId,
      details: `Mailed ${sent} PDF payslip emails via Nodemailer (${failed} failed) for payrun "${payrun.name}"`,
      userId: authUser.userId,
    });

    return { success: true, sent, failed, total: payrun.payslips.length, method: 'NODEMAILER' };
  }

  /**
   * Dispatch payslips for a payrun (default fallback).
   */
  async dispatchPayslips(payrunId: string, authUser: AuthUser) {
    return this.publishToPortal(payrunId, authUser);
  }
}

export const reportsService = new ReportsService();
