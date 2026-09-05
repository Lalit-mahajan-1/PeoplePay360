import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';
import prisma from '../lib/prisma';
import { avatarStorage } from '../services/avatar-storage.service';

const getCurrentEmployeeId = async (req: Request): Promise<string | undefined> => {
  if (req.user?.employeeId) return req.user.employeeId;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return undefined;
  return (await prisma.employee.findUnique({ where: { email: user.email }, select: { id: true } }))?.id;
};

// ──────────────────────────────────────────────
// EMPLOYEE SELF-SERVICE CONTROLLERS (NEW)
// ──────────────────────────────────────────────

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    let employeeId = req.user?.employeeId;

    if (!employeeId) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { employee: true },
      });

      if (user?.employee) {
        employeeId = user.employee.id;
      } else if (user) {
        let emp = await prisma.employee.findUnique({ where: { email: user.email } });
        if (!emp) {
          const count = await prisma.employee.count();
          const code = `EMP${String(count + 1).padStart(3, '0')}`;
          const emailParts = user.email.split('@')[0].split('.');
          const firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
          const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : 'User';
          
          emp = await prisma.employee.create({
            data: {
              employeeCode: code,
              firstName,
              lastName,
              email: user.email,
              status: 'ACTIVE',
              employeeType: 'FULL_TIME',
            },
          });
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { employeeId: emp.id },
        });
        employeeId = emp.id;
      }
    }

    const profile = await employeeService.getMyProfile(employeeId!);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching own profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    let employeeId = req.user?.employeeId;

    if (!employeeId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (user) {
        const emp = await prisma.employee.findUnique({ where: { email: user.email } });
        if (emp) employeeId = emp.id;
      }
    }

    if (!employeeId) {
      res.status(400).json({
        success: false,
        message: 'No employee record linked to this account.',
      });
      return;
    }

    const updated = await employeeService.updateMyProfile(
      employeeId,
      req.body,
      req.user!
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error updating own profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ──────────────────────────────────────────────
// ADMIN / HR CONTROLLERS (Existing)
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// DEPARTMENT CONTROLLERS (Existing)
// ──────────────────────────────────────────────

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
export const uploadMyAvatar = async (req: Request, res: Response): Promise<void> => {
  let uploadedUrl: string | undefined;
  try {
    const employeeId = await getCurrentEmployeeId(req);
    if (!employeeId) { res.status(400).json({ success: false, message: 'No employee record linked to this account.' }); return; }
    const existing = await employeeService.getMyProfile(employeeId);
    const contentType = req.headers['content-type']?.split(';')[0].trim().toLowerCase() || '';
    if (!Buffer.isBuffer(req.body)) throw { status: 400, message: 'Send the image as the request body.' };
    uploadedUrl = await avatarStorage.upload(employeeId, req.body, contentType);
    const updated = await employeeService.updateAvatar(employeeId, uploadedUrl, req.user!);
    try { await avatarStorage.removeByPublicUrl(existing.avatarUrl); } catch (error) { console.error('Previous avatar cleanup failed:', error); }
    res.json({ success: true, message: 'Profile image uploaded successfully.', data: updated });
  } catch (error: any) {
    if (uploadedUrl) try { await avatarStorage.removeByPublicUrl(uploadedUrl); } catch { }
    if (error.status) { res.status(error.status).json({ success: false, message: error.message }); return; }
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile image.' });
  }
};

export const deleteMyAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeId = await getCurrentEmployeeId(req);
    if (!employeeId) { res.status(400).json({ success: false, message: 'No employee record linked to this account.' }); return; }
    const existing = await employeeService.getMyProfile(employeeId);
    const updated = await employeeService.updateAvatar(employeeId, null, req.user!);
    try { await avatarStorage.removeByPublicUrl(existing.avatarUrl); } catch (error) { console.error('Avatar storage cleanup failed:', error); }
    res.json({ success: true, message: 'Profile image removed successfully.', data: updated });
  } catch (error: any) {
    if (error.status) { res.status(error.status).json({ success: false, message: error.message }); return; }
    console.error('Error deleting profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete profile image.' });
  }
};