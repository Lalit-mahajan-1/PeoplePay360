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

const router = Router();

// Department routes
router.get('/departments', getAllDepartments);
router.post('/departments', createDepartment);

// Employee routes
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;