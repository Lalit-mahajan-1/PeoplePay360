import { Request, Response } from 'express';
import { payrollService } from '../services/payroll.service';
import prisma from '../lib/prisma';

// ========== PAYRUNS ==========
export const getAllPayruns = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      salaryStructureId: req.query.salaryStructureId as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
    };
    const payruns = await payrollService.getAllPayruns(filters);
    res.json({ success: true, data: payruns, count: payruns.length });
  } catch (e: any) { handleError(res, e, 'fetching payruns'); }
};

export const getPayrunById = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrun = await payrollService.getPayrunById(req.params.id as string);
    if (!payrun) { res.status(404).json({ success: false, message: 'Payrun not found' }); return; }
    res.json({ success: true, data: payrun });
  } catch (e: any) { handleError(res, e, 'fetching payrun'); }
};

export const getEligibleEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { salaryStructureId, periodStart, periodEnd, departmentId } = req.query;
    if (!salaryStructureId || !periodStart || !periodEnd) {
      res.status(400).json({ success: false, message: 'salaryStructureId, periodStart, periodEnd query params required' });
      return;
    }
    const employees = await payrollService.getEligibleEmployeesForPayrun(
      salaryStructureId as string,
      periodStart as string,
      periodEnd as string,
      departmentId as string | undefined,
    );
    res.json({ success: true, data: employees, count: employees.length });
  } catch (e: any) { handleError(res, e, 'fetching eligible employees'); }
};

export const previewPayrunStep1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await payrollService.createPayrunStep1(req.body, req.user!);
    res.json({ success: true, data: result });
  } catch (e: any) { handleError(res, e, 'previewing payrun step 1'); }
};

export const createPayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrun = await payrollService.createPayrun(req.body, req.user!);
    res.status(201).json({ success: true, data: payrun });
  } catch (e: any) { handleError(res, e, 'creating payrun'); }
};

export const computePayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrun = await payrollService.computePayrun(req.params.id as string, req.user!);
    res.json({ success: true, data: payrun });
  } catch (e: any) { handleError(res, e, 'computing payrun'); }
};

export const validatePayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrun = await payrollService.validatePayrun(req.params.id as string, req.user!);
    res.json({ success: true, data: payrun });
  } catch (e: any) { handleError(res, e, 'validating payrun'); }
};

export const markPayrunPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrun = await payrollService.markPayrunPaid(req.params.id as string, req.user!);
    res.json({ success: true, data: payrun });
  } catch (e: any) { handleError(res, e, 'marking payrun paid'); }
};

export const sendPayslips = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await payrollService.sendPayslips(req.params.id as string, req.user!);
    res.json({ success: true, data: result, message: `Sent ${result.sent} payslip emails` });
  } catch (e: any) { handleError(res, e, 'sending payslips'); }
};

// ========== PAYSLIPS ==========
export const getPayslipById = async (req: Request, res: Response): Promise<void> => {
  try {
    const payslip = await payrollService.getPayslipById(req.params.id as string);
    if (!payslip) { res.status(404).json({ success: false, message: 'Payslip not found' }); return; }
    res.json({ success: true, data: payslip });
  } catch (e: any) { handleError(res, e, 'fetching payslip'); }
};

export const getMyPayslips = async (req: Request, res: Response): Promise<void> => {
  try {
    let employeeId = req.user?.employeeId;
    if (!employeeId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { employee: true } });
      employeeId = user?.employee?.id;
    }
    if (!employeeId) { res.status(400).json({ success: false, message: 'No employee record linked' }); return; }
    const payslips = await payrollService.getMyPayslips(employeeId);
    res.json({ success: true, data: payslips });
  } catch (e: any) { handleError(res, e, 'fetching my payslips'); }
};

export const getPayslipsForPayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const payslips = await payrollService.getPayslipsForPayrun(req.params.payrunId as string);
    res.json({ success: true, data: payslips, count: payslips.length });
  } catch (e: any) { handleError(res, e, 'fetching payslips for payrun'); }
};

// ========== PRINT PAYSLIP ==========
export const printPayslip = async (req: Request, res: Response): Promise<void> => {
  try {
    const payslip = await payrollService.getPayslipById(req.params.id as string);
    if (!payslip) { res.status(404).json({ success: false, message: 'Payslip not found' }); return; }

    const html = generatePayslipHTML(payslip);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (e: any) { handleError(res, e, 'generating payslip'); }
};

function generatePayslipHTML(p: any) {
  const emp = p.employee;
  const lines = p.lines || [];
  const earnings = lines.filter((l: any) => ['BASIC', 'ALLOWANCE'].includes(l.category));
  const deductions = lines.filter((l: any) => l.category === 'DEDUCTION');

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateFmt = (d: any) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Payslip ${emp.employeeCode} - ${dateFmt(p.periodStart)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;padding:20px;}
  .wrap{max-width:850px;margin:0 auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.08);border-radius:12px;overflow:hidden;}
  .header{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:28px 32px;}
  .header h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.5px;}
  .header p{margin:4px 0 0;opacity:.85;font-size:13px;}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;padding:28px 32px;}
  .info-block h3{margin:0 0 12px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;}
  .info-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13.5px;border-bottom:1px dashed #e5e7eb;}
  .info-row span:last-child{font-weight:600;color:#111827;}
  .earn,.ded{padding:0 32px 24px;}
  table{width:100%;border-collapse:collapse;font-size:13.5px;}
  th{background:#f9fafb;padding:10px 12px;text-align:left;color:#374151;font-size:12px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;border-bottom:2px solid #e5e7eb;}
  td{padding:10px 12px;border-bottom:1px solid #f3f4f6;}
  tr.total td{background:#f9fafb;font-weight:700;color:#111827;font-size:14px;border-top:2px solid #e5e7eb;}
  .net-wrap{margin:0 32px 28px;padding:20px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;border:1px solid #a7f3d0;}
  .net-wrap .net-label{font-size:12px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;}
  .net-wrap .net-amt{font-size:32px;font-weight:800;color:#065f46;margin-top:4px;}
  .footer{padding:20px 32px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;}
  .tag{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;}
  .tag-paid{background:#d1fae5;color:#065f46;}
  .tag-valid{background:#dbeafe;color:#1e40af;}
  .tag-computed{background:#fef3c7;color:#92400e;}
</style></head><body><div class="wrap">
<div class="header">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1>PeoplePay360 Payslip</h1>
      <p>Period: ${dateFmt(p.periodStart)} to ${dateFmt(p.periodEnd)}</p>
    </div>
    <span class="tag ${p.status === 'PAID' ? 'tag-paid' : p.status === 'VALIDATED' ? 'tag-valid' : 'tag-computed'}">${p.status}</span>
  </div>
</div>
<div class="grid">
  <div class="info-block">
    <h3>Employee Details</h3>
    <div class="info-row"><span>Employee ID</span><span>${emp.employeeCode}</span></div>
    <div class="info-row"><span>Full Name</span><span>${emp.firstName} ${emp.lastName}</span></div>
    <div class="info-row"><span>Email</span><span>${emp.email}</span></div>
    <div class="info-row"><span>Department</span><span>${p.contract?.department?.name || '-'}</span></div>
    <div class="info-row"><span>Worked Days</span><span>${Number(p.workedDays || 0)}</span></div>
  </div>
  <div class="info-block">
    <h3>Payment Details</h3>
    <div class="info-row"><span>Payslip #</span><span>${p.id.slice(-8).toUpperCase()}</span></div>
    <div class="info-row"><span>Structure</span><span>${p.salaryStructure?.name || '-'}</span></div>
    <div class="info-row"><span>Bank</span><span>${emp.bankName || '-'}</span></div>
    <div class="info-row"><span>A/C No.</span><span>${emp.bankAccountNo ? 'XXXX' + emp.bankAccountNo.slice(-4) : '-'}</span></div>
    <div class="info-row"><span>Generated</span><span>${dateFmt(p.computedAt)}</span></div>
  </div>
</div>
<div class="earn">
  <h3 style="margin:0 0 12px;font-size:12px;color:#047857;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Earnings</h3>
  <table>
    <thead><tr><th>Component</th><th>Category</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>
      ${earnings.map((l: any) => `<tr><td>${l.name}</td><td><span style="font-size:11px;color:#6b7280;">${l.category}</span></td><td style="text-align:right;font-weight:600;">${fmt(l.amount)}</td></tr>`).join('')}
      <tr class="total"><td colspan="2">Gross Earnings</td><td style="text-align:right;">${fmt(p.grossAmount)}</td></tr>
    </tbody>
  </table>
</div>
<div class="ded">
  <h3 style="margin:0 0 12px;font-size:12px;color:#b91c1c;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Deductions</h3>
  <table>
    <thead><tr><th>Component</th><th>Category</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>
      ${deductions.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:16px;">No deductions</td></tr>' :
        deductions.map((l: any) => `<tr><td>${l.name}</td><td><span style="font-size:11px;color:#6b7280;">${l.category}</span></td><td style="text-align:right;font-weight:600;color:#b91c1c;">− ${fmt(l.amount)}</td></tr>`).join('')}
      <tr class="total"><td colspan="2">Total Deductions</td><td style="text-align:right;color:#b91c1c;">− ${fmt(p.deductionAmount)}</td></tr>
    </tbody>
  </table>
</div>
<div class="net-wrap">
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div><div class="net-label">Net Salary Payable</div><div class="net-amt">${fmt(p.netAmount)}</div></div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#6b7280;">Basic ${fmt(p.basicAmount)} + Allowances ${fmt(p.allowanceAmount)} − Deductions ${fmt(p.deductionAmount)}</div>
    </div>
  </div>
</div>
<div class="footer">This is a computer-generated payslip from PeoplePay360 HR & Payroll Platform.</div>
</div></body></html>`;
}

function handleError(res: Response, error: any, context: string) {
  if (error.status) { res.status(error.status).json({ success: false, message: error.message }); return; }
  console.error(`Error ${context}:`, error);
  res.status(500).json({ success: false, message: `Failed ${context}` });
}
