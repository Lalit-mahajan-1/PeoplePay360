import { Request, Response } from 'express';
import { EmployeeStatus, EmployeeType } from '@prisma/client';
import prisma from '../lib/prisma';

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, departmentId, employeeType, search } = req.query;

    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status as EmployeeStatus;
    }
    if (departmentId && typeof departmentId === 'string') {
      where.departmentId = departmentId;
    }
    if (employeeType && typeof employeeType === 'string') {
      where.employeeType = employeeType as EmployeeType;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        subordinates: {
          select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true },
        },
      },
    });

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
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      departmentId,
      jobPosition,
      jobTitle,
      managerId,
      hireDate,
      status,
      employeeType,
      address,
      city,
      state,
      country,
      postalCode,
      bankName,
      bankAccountNo,
      bankIFSC,
      avatarUrl,
    } = req.body;

    if (!employeeCode || !firstName || !lastName || !email) {
      res.status(400).json({
        success: false,
        message: 'employeeCode, firstName, lastName, and email are required',
      });
      return;
    }

    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ employeeCode }, { email }],
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message:
          existing.employeeCode === employeeCode
            ? 'Employee code already exists'
            : 'Email already exists',
      });
      return;
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        departmentId,
        jobPosition,
        jobTitle,
        managerId,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        status: status || 'ACTIVE',
        employeeType: employeeType || 'FULL_TIME',
        address,
        city,
        state,
        country,
        postalCode,
        bankName,
        bankAccountNo,
        bankIFSC,
        avatarUrl,
      },
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const data: any = { ...req.body };
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.hireDate) data.hireDate = new Date(data.hireDate);

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    await prisma.employee.delete({ where: { id } });

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
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