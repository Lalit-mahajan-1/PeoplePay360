import { Router } from 'express';
import {
  getAllPayruns, getPayrunById, createPayrun, computePayrun, validatePayrun, markPayrunPaid,
  sendPayslips, deletePayrun, getPayslipById, getMyPayslips, getPayslipsForPayrun,
  getEligibleEmployees, previewPayrunStep1, printPayslip,
} from '../controllers/payroll.controller';
import { publishToPortalReport, emailPayslipsReport } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const ALL_PAYROLL = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const PAYROLL_MANAGER = ['HR_PAYROLL_MANAGER', 'ADMIN'];
const ALL_ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

// Employee payslip self-service
router.get('/payslips/mine', authorize(ALL_ROLES), getMyPayslips);
router.get('/payslips/:id/print', authorize(ALL_PAYROLL.concat('EMPLOYEE')), printPayslip);
router.get('/payslips/:id', authorize(ALL_PAYROLL.concat('EMPLOYEE')), getPayslipById);

// Payrun eligible employees preview
router.get('/eligible', authorize(ALL_PAYROLL), getEligibleEmployees);
router.post('/preview-step1', authorize(ALL_PAYROLL), previewPayrunStep1);

// Payruns CRUD + workflow
router.get('/payruns', authorize(ALL_PAYROLL), getAllPayruns);
router.post('/payruns', authorize(ALL_PAYROLL), createPayrun);
router.get('/payruns/:id', authorize(ALL_PAYROLL), getPayrunById);
router.post('/payruns/:id/compute', authorize(ALL_PAYROLL), computePayrun);
router.post('/payruns/:id/validate', authorize(ALL_PAYROLL), validatePayrun);
router.post('/payruns/:id/mark-paid', authorize(PAYROLL_MANAGER), markPayrunPaid);
router.post('/payruns/:id/send-payslips', authorize(PAYROLL_MANAGER), sendPayslips);
router.post('/payruns/:id/send', authorize(PAYROLL_MANAGER), sendPayslips);
router.post('/payruns/:id/publish-portal', authorize(PAYROLL_MANAGER), publishToPortalReport);
router.post('/payruns/:id/send-email', authorize(PAYROLL_MANAGER), emailPayslipsReport);
router.delete('/payruns/:id', authorize(PAYROLL_MANAGER), deletePayrun);
router.get('/payruns/:payrunId/payslips', authorize(ALL_PAYROLL), getPayslipsForPayrun);

export default router;
