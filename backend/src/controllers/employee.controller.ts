import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';
import prisma from '../lib/prisma';

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      employeeType: req.query.employeeType as string | undefined,
      search: req.query.search as string | undefined,
    };

    const employees = await employeeService.getAll(filters);

    res.json({ success: true, data: employees, count: employees.length });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const employee = await employeeService.getById(id);

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await employeeService.create(req.body, req.user!);
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const employee = await employeeService.update(id, req.body, req.user!);
    res.json({ success: true, data: employee });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await employeeService.delete(id, req.user!);
    res.json({ success: true, message: 'Employee archived successfully' });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
};

// Department Controllers
export const getAllDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, parentId } = req.body;
    if (!name || !code) {
      res.status(400).json({ success: false, message: 'Name and code are required' });
      return;
    }
    const department = await prisma.department.create({
      data: { name, code, parentId },
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
};