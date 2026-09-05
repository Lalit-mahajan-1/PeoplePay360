import { Request, Response } from 'express';
import { reportsService } from '../services/reports.service';

export const getPayrollSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      periodStart: req.query.periodStart as string | undefined,
      periodEnd: req.query.periodEnd as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      payrunId: req.query.payrunId as string | undefined,
    };
    const report = await reportsService.getPayrollSummary(filters);
    res.json({ success: true, data: report });
  } catch (e: any) {
    handleError(res, e, 'generating payroll summary report');
  }
};

export const getEmployeePayslipsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      payrunId: req.query.payrunId as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const payslips = await reportsService.getEmployeePayslipsReport(filters);
    res.json({ success: true, data: payslips, count: payslips.length });
  } catch (e: any) {
    handleError(res, e, 'fetching employee payslips report');
  }
};

export const printPayslipReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const html = await reportsService.generatePayslipHTML(req.params.id as string);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (e: any) {
    handleError(res, e, 'generating payslip report HTML');
  }
};

export const dispatchPayslipsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { payrunId } = req.body;
    if (!payrunId) {
      res.status(400).json({ success: false, message: 'payrunId is required' });
      return;
    }
    const result = await reportsService.dispatchPayslips(payrunId, req.user!);
    res.json({ success: true, data: result, message: `Successfully dispatched ${result.count} payslips` });
  } catch (e: any) {
    handleError(res, e, 'dispatching payslips report');
  }
};

export const publishToPortalReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrunId = req.body.payrunId || req.params.id || req.query.payrunId;
    if (!payrunId) {
      res.status(400).json({ success: false, message: 'payrunId is required' });
      return;
    }
    const result = await reportsService.publishToPortal(payrunId as string, req.user!);
    res.json({ success: true, data: result, message: `Published ${result.count} payslips to Employee Portal` });
  } catch (e: any) {
    handleError(res, e, 'publishing payslips to portal');
  }
};

export const emailPayslipsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const payrunId = req.body.payrunId || req.params.id || req.query.payrunId;
    if (!payrunId) {
      res.status(400).json({ success: false, message: 'payrunId is required' });
      return;
    }
    const result = await reportsService.emailPayslipsWithNodemailer(payrunId as string, req.user!);
    res.json({ success: true, data: result, message: `Mailed ${result.sent} payslips via Nodemailer (${result.failed} failed)` });
  } catch (e: any) {
    handleError(res, e, 'emailing payslips via nodemailer');
  }
};

function handleError(res: Response, error: any, context: string) {
  if (error.status) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }
  console.error(`Error ${context}:`, error);
  res.status(500).json({ success: false, message: `Failed ${context}` });
}
