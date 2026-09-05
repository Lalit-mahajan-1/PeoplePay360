import express, { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllDepartments,
  createDepartment,
} from '../controllers/employee.controller';
import { getMyPayslips } from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  validateCreateEmployee,
  validateUpdateEmployee,
} from '../validators/employee.validator';

const router = Router();

// ── Global: every route below requires a valid JWT ──
router.use(authenticate);

// ──────────────────────────────────────────────
// 👤 EMPLOYEE SELF-SERVICE  (any authenticated user with an employeeId)
//    These MUST come BEFORE /:id to avoid param collision
// ──────────────────────────────────────────────
router.get(
  '/me',
  authorize(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  getMyProfile
);

router.put(
  '/me',
  authorize(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  updateMyProfile
);
router.put(
  '/me/avatar',
  authorize(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  express.raw({ type: '*/*', limit: '5mb' }),
  uploadMyAvatar
);

router.delete(
  '/me/avatar',
  authorize(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  deleteMyAvatar
);

router.get(
  '/me/payslips',
  authorize(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  getMyPayslips
);

// ──────────────────────────────────────────────
// 🏢 DEPARTMENT ROUTES
// ──────────────────────────────────────────────
router.get(
  '/departments',
  authorize(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  getAllDepartments
);

router.post(
  '/departments',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN']),
  createDepartment
);

// ──────────────────────────────────────────────
// 🛠️ ADMIN / HR EMPLOYEE MANAGEMENT
// ──────────────────────────────────────────────
router.get(
  '/',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  getAllEmployees
);

router.get(
  '/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN']),
  getEmployeeById
);

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
  authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  deleteEmployee
);

export default router;