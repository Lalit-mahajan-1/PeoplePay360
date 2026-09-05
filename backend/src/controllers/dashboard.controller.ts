import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const getPayrollDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      periodStart: req.query.periodStart as string | undefined,
      periodEnd: req.query.periodEnd as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      employeeType: req.query.employeeType as string | undefined,
    };
    const data = await dashboardService.getPayrollDashboard(filters);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};
