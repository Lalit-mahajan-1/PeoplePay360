import { Router } from 'express';
import {
  getAllTimeOffTypes, createTimeOffType, updateTimeOffType, deleteTimeOffType,
  getAllAllocations, getMyAllocations, createAllocation, approveAllocation, updateAllocation,
  getAllRequests, getMyRequests, createRequest, approveRequest, refuseRequest, cancelRequest,
} from '../controllers/time-off.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const ALL_ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const HR_ROLES = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const ADMIN_ROLES = ['HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

// === TYPES ===
router.get('/types', authorize(ALL_ROLES), getAllTimeOffTypes);
router.post('/types', authorize(HR_ROLES), createTimeOffType);
router.put('/types/:id', authorize(HR_ROLES), updateTimeOffType);
router.delete('/types/:id', authorize(ADMIN_ROLES), deleteTimeOffType);

// === ALLOCATIONS ===
router.get('/allocations/mine', authorize(ALL_ROLES), getMyAllocations);
router.get('/allocations', authorize(HR_ROLES), getAllAllocations);
router.post('/allocations', authorize(HR_ROLES), createAllocation);
router.put('/allocations/:id', authorize(HR_ROLES), updateAllocation);
router.post('/allocations/:id/approve', authorize(HR_ROLES), approveAllocation);

// === REQUESTS ===
router.get('/requests/mine', authorize(ALL_ROLES), getMyRequests);
router.post('/requests', authorize(ALL_ROLES), createRequest);
router.post('/requests/:id/cancel', authorize(ALL_ROLES), cancelRequest);
router.get('/requests', authorize(HR_ROLES), getAllRequests);
router.post('/requests/:id/approve', authorize(HR_ROLES), approveRequest);
router.post('/requests/:id/refuse', authorize(HR_ROLES), refuseRequest);

export default router;
