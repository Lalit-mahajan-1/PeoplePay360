import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllDepartments,
  createDepartment,
} from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validateCreateEmployee, validateUpdateEmployee } from '../validators/employee.validator';

const router = Router();

// All employee routes require authentication
router.use(authenticate);

// Department routes
router.get('/departments', getAllDepartments);
router.post(
  '/departments',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  createDepartment
);

// Employee routes
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);

router.post(
  '/',
  authorize(['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  validateCreateEmployee,
  createEmployee
);

router.put(
  '/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  validateUpdateEmployee,
  updateEmployee
);

router.delete(
  '/:id',
  authorize(['HR_PAYROLL_MANAGER', 'ADMIN']),
  deleteEmployee
);

export default router;