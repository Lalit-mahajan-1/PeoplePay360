import { Router } from 'express';
import {
  getTodayAttendance,
  checkIn,
  checkOut,
  getMySummary,
  getMyHistory,
  getAllAttendance,
  getAttendanceById,
  correctAttendance,
  bulkMarkAttendance,
  createMedicalAbsence,
  closeAttendanceDay,
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  validateCorrection,
  validateBulkMark,
  validateMedicalAbsence,
  validateCloseDay,
} from '../validators/attendance.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

const ALL_ROLES = [
  'EMPLOYEE',
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
];

const HR_ROLES = [
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
];

// ──────────────────────────────────────────────
// 👤 EMPLOYEE SELF-SERVICE
//    MUST come before /:id to avoid param collision
// ──────────────────────────────────────────────

router.get('/today', authorize(ALL_ROLES), getTodayAttendance);
router.post('/check-in', authorize(ALL_ROLES), checkIn);
router.post('/check-out', authorize(ALL_ROLES), checkOut);
router.get('/my-summary', authorize(ALL_ROLES), getMySummary);
router.get('/my-history', authorize(ALL_ROLES), getMyHistory);

// ──────────────────────────────────────────────
// 🏢 HR / ADMIN MANAGEMENT
// ──────────────────────────────────────────────

router.get('/', authorize(HR_ROLES), getAllAttendance);
router.post('/', authorize(HR_ROLES), validateMedicalAbsence, createMedicalAbsence);
router.post('/close-day', authorize(HR_ROLES), validateCloseDay, closeAttendanceDay);
router.get('/:id', authorize(HR_ROLES), getAttendanceById);
router.put(
  '/:id',
  authorize(HR_ROLES),
  validateCorrection,
  correctAttendance
);
router.post(
  '/bulk-mark',
  authorize(HR_ROLES),
  validateBulkMark,
  bulkMarkAttendance
);

export default router;
