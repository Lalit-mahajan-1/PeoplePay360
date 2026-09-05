import { Router } from 'express';
import {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getActiveContractForEmployee,
} from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const ALL_ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const HR_ROLES = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const ADMIN_ROLES = ['HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

router.get('/', authorize(HR_ROLES), getAllContracts);
router.get('/active/:employeeId', authorize(ALL_ROLES), getActiveContractForEmployee);
router.get('/:id', authorize(HR_ROLES), getContractById);
router.post('/', authorize(HR_ROLES), createContract);
router.put('/:id', authorize(HR_ROLES), updateContract);
router.delete('/:id', authorize(ADMIN_ROLES), deleteContract);

export default router;
