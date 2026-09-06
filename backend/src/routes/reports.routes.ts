import { Router } from 'express';
import {
  getPayrollSummary,
  getEmployeePayslipsReport,
  printPayslipReport,
  dispatchPayslipsReport,
  publishToPortalReport,
  emailPayslipsReport,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const ALL_PAYROLL = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const PAYROLL_MANAGER = ['HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

// Reports APIs
router.get('/payroll-summary', authorize(ALL_PAYROLL), getPayrollSummary);
router.get('/employee-payslips', authorize(ALL_PAYROLL), getEmployeePayslipsReport);
router.get('/payslip/:id/pdf', authorize(ALL_PAYROLL.concat('EMPLOYEE')), printPayslipReport);
router.get('/payslip/:id/print', authorize(ALL_PAYROLL.concat('EMPLOYEE')), printPayslipReport);
router.post('/dispatch-payslips', authorize(ALL_PAYROLL), dispatchPayslipsReport);
router.post('/publish-portal', authorize(ALL_PAYROLL), publishToPortalReport);
router.post('/publish-portal/:id', authorize(ALL_PAYROLL), publishToPortalReport);
router.post('/send-email', authorize(ALL_PAYROLL), emailPayslipsReport);
router.post('/send-email/:id', authorize(ALL_PAYROLL), emailPayslipsReport);

export default router;
