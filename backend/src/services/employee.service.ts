import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

interface CreateEmployeeData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  jobProfile?: string;
  managerId?: string;
  hireDate?: string;
  status?: string;
  employeeType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIFSC?: string;
  avatarUrl?: string;
}

export class EmployeeService {

  // ──────────────────────────────────────────────
  // ADMIN / HR METHODS (Existing)
  // ──────────────────────────────────────────────

  async getAll(filters: {
    status?: string;
      employeeType?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.employeeType) where.employeeType = filters.employeeType;

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: { select: { id: true, role: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return employees;
  }

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, role: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return employee;
  }

  async create(data: CreateEmployeeData, authUser: AuthUser) {
    // Check duplicate code
    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode },
    });
    if (existingCode) {
      throw { status: 409, message: 'Employee code already exists' };
    }

    // Check duplicate email
    const existingEmail = await prisma.employee.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw { status: 409, message: 'Email already exists' };
    }

    // Validate manager exists
    if (data.managerId) {
      const mgr = await prisma.employee.findUnique({
        where: { id: data.managerId },
      });
      if (!mgr) {
        throw { status: 400, message: 'Manager not found' };
      }
    }

    const defaultPasswordHash = await bcrypt.hash('default123', 12);
    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender as any,
        jobProfile: (data.jobProfile as any) || 'EMPLOYEE',
        password: defaultPasswordHash,
        managerId: data.managerId,
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
        status: (data.status as any) || 'ACTIVE',
        employeeType: (data.employeeType as any) || 'FULL_TIME',
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        bankIFSC: data.bankIFSC,
        avatarUrl: data.avatarUrl,
      },
      include: {
        user: { select: { id: true, role: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'EMPLOYEE',
      recordId: employee.id,
      details: `Created employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
      userId: authUser.userId,
    });

    return employee;
  }

  async update(id: string, data: any, authUser: AuthUser) {
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { role: true } } },
    });
    if (!existing) {
      throw { status: 404, message: 'Employee not found' };
    }

    // Role-scoping: HR Manager can only edit users with 'EMPLOYEE' role
    if (authUser.role !== 'ADMIN' && existing.user?.role && existing.user.role !== 'EMPLOYEE') {
      throw { status: 403, message: 'HR Managers can only modify standard employees with the EMPLOYEE role.' };
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.employee.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        throw { status: 409, message: 'Email already in use' };
      }
    }

    const updateData: any = { ...data };
    delete updateData.departmentId;
    delete updateData.jobTitle;
    delete updateData.jobPosition;
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.hireDate) updateData.hireDate = new Date(updateData.hireDate);
    if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, role: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      module: 'EMPLOYEE',
      recordId: employee.id,
      details: `Updated employee ${employee.firstName} ${employee.lastName}`,
      userId: authUser.userId,
    });

    return employee;
  }

  async delete(id: string, authUser: AuthUser) {
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { role: true } } },
    });
    if (!existing) {
      throw { status: 404, message: 'Employee not found' };
    }

    // Role-scoping: HR Manager can only soft-delete users with 'EMPLOYEE' role
    if (authUser.role !== 'ADMIN' && existing.user?.role && existing.user.role !== 'EMPLOYEE') {
      throw { status: 403, message: 'HR Managers can only soft-delete standard employees with the EMPLOYEE role.' };
    }

    await prisma.employee.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await createAuditLog({
      action: 'DELETE',
      module: 'EMPLOYEE',
      recordId: id,
      details: `Archived employee ${existing.firstName} ${existing.lastName} (${existing.employeeCode})`,
      userId: authUser.userId,
    });
  }

  // ──────────────────────────────────────────────
  // EMPLOYEE SELF-SERVICE METHODS (NEW)
  // ──────────────────────────────────────────────

  async getMyProfile(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw { status: 404, message: 'Employee profile not found' };
    }

    if (employee.status === 'ARCHIVED') {
      throw { status: 403, message: 'Your account has been archived' };
    }

    return employee;
  }

  async updateMyProfile(employeeId: string, updates: any, authUser: AuthUser) {
    const existing = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existing) {
      throw { status: 404, message: 'Employee profile not found' };
    }

    // ── Whitelist: ONLY these fields can be changed by the employee ──
    const allowedFields = [
      'phone',
      'address',
      'city',
      'state',
      'country',
      'postalCode',
      'bankName',
      'bankAccountNo',
      'bankIFSC',
    ];

    const sanitized: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitized[key] = updates[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      throw {
        status: 400,
        message: `No valid fields to update. Allowed: [${allowedFields.join(', ')}]`,
      };
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: sanitized,
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      module: 'EMPLOYEE',
      recordId: employeeId,
      details: `Employee self-updated fields: [${Object.keys(sanitized).join(', ')}]`,
      userId: authUser.userId,
    });

    return updated;
  }
  async updateAvatar(employeeId: string, avatarUrl: string | null, authUser: AuthUser) {
    const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!existing) throw { status: 404, message: 'Employee profile not found' };
    if (existing.status === 'ARCHIVED') throw { status: 403, message: 'Your account has been archived' };
    const updated = await prisma.employee.update({
      where: { id: employeeId }, data: { avatarUrl },
      include: { manager: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    await createAuditLog({ action: avatarUrl ? 'UPLOAD' : 'DELETE', module: 'EMPLOYEE_AVATAR', recordId: employeeId, details: avatarUrl ? 'Uploaded profile image' : 'Removed profile image', userId: authUser.userId });
    return updated;
  }
}

export const employeeService = new EmployeeService();