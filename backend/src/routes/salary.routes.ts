import { Router } from 'express';
import {
  getAllSalaryRules, getSalaryRuleById, createSalaryRule, updateSalaryRule, deleteSalaryRule,
  getAllSalaryStructures, getSalaryStructureById, createSalaryStructure, updateSalaryStructure, deleteSalaryStructure,
} from '../controllers/salary.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

const ALL_PAYROLL = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const PAYROLL_MANAGER = ['HR_PAYROLL_MANAGER', 'ADMIN'];
const ALL_WITH_EMP = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

router.use(authenticate);

// Structures are readable and editable by all payroll users; delete restricted to managers
router.get('/structures', authorize(ALL_WITH_EMP), getAllSalaryStructures);
router.get('/structures/:id', authorize(ALL_WITH_EMP), getSalaryStructureById);
router.post('/structures', authorize(ALL_PAYROLL), createSalaryStructure);
router.put('/structures/:id', authorize(ALL_PAYROLL), updateSalaryStructure);
router.delete('/structures/:id', authorize(PAYROLL_MANAGER), deleteSalaryStructure);

// Rules: Readable and editable by all payroll users; delete restricted to managers
router.get('/rules', authorize(ALL_PAYROLL.concat('HR_MANAGER', 'EMPLOYEE')), getAllSalaryRules);
router.get('/rules/:id', authorize(ALL_PAYROLL.concat('HR_MANAGER')), getSalaryRuleById);
router.post('/rules', authorize(ALL_PAYROLL), createSalaryRule);
router.put('/rules/:id', authorize(ALL_PAYROLL), updateSalaryRule);
router.delete('/rules/:id', authorize(PAYROLL_MANAGER), deleteSalaryRule);

export default router;
