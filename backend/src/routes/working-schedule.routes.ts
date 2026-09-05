import { Router } from 'express';
import {
  getAllWorkingSchedules,
  getWorkingScheduleById,
  createWorkingSchedule,
  updateWorkingSchedule,
  deleteWorkingSchedule,
} from '../controllers/working-schedule.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const ALL_ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const HR_ROLES = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const ADMIN_ROLES = ['HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

router.get('/', authorize(ALL_ROLES), getAllWorkingSchedules);
router.get('/:id', authorize(ALL_ROLES), getWorkingScheduleById);
router.post('/', authorize(HR_ROLES), createWorkingSchedule);
router.put('/:id', authorize(HR_ROLES), updateWorkingSchedule);
router.delete('/:id', authorize(ADMIN_ROLES), deleteWorkingSchedule);

export default router;
