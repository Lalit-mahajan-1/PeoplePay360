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
  departmentId?: string;
  jobPosition?: string;
  jobTitle?: string;
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
    departmentId?: string;
    employeeType?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;
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
        department: true,
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
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobPosition: true,
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

    // Validate department exists
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!dept) {
        throw { status: 400, message: 'Department not found' };
      }
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

    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender as any,
        departmentId: data.departmentId,
        jobPosition: data.jobPosition,
        jobTitle: data.jobTitle,
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
        department: true,
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
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, message: 'Employee not found' };
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
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.hireDate) updateData.hireDate = new Date(updateData.hireDate);
    if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
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
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, message: 'Employee not found' };
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
        department: {
          select: { id: true, name: true, code: true },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
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
      'avatarUrl',
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
        department: {
          select: { id: true, name: true, code: true },
        },
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
}

export const employeeService = new EmployeeService();