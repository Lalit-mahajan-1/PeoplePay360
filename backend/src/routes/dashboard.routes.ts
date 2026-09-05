import { Router } from 'express';
import { getPayrollDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const PAYROLL_ROLES = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const ALL_HR = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

router.get('/payroll', authorize(PAYROLL_ROLES), getPayrollDashboard);
router.get('/overview', authorize(ALL_HR), getPayrollDashboard);

export default router;
