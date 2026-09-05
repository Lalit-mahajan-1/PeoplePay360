import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const GRACE_MINUTES = 15;
const STANDARD_WORK_MINUTES = 480; // 8 hours
const STANDARD_START_HOUR = 9; // 9:00 AM

function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

export class AttendanceService {
  /**
   * Resolve the employeeId for the logged-in user.
   */
  private async resolveEmployeeId(authUser: AuthUser): Promise<string> {
    if (authUser.employeeId) return authUser.employeeId;

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { employee: true },
    });

    if (user?.employee) return user.employee.id;

    if (user) {
      let emp = await prisma.employee.findUnique({
        where: { email: user.email },
      });
      if (!emp) {
        const count = await prisma.employee.count();
        const code = `EMP${String(count + 1).padStart(3, '0')}`;
        const parts = user.email.split('@')[0].split('.');
        emp = await prisma.employee.create({
          data: {
            employeeCode: code,
            firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
            lastName: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User',
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
      return emp.id;
    }

    throw { status: 400, message: 'No employee record linked to your account' };
  }

  // ──────────────────────────────────────────────
  // EMPLOYEE SELF-SERVICE
  // ──────────────────────────────────────────────

  async getToday(authUser: AuthUser) {
    const employeeId = await this.resolveEmployeeId(authUser);
    const today = getTodayDate();
    const dayOfWeek = today.getUTCDay();
    const weekday = WEEKDAYS[dayOfWeek];
    const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri

    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate: today,
        },
      },
    });

    return {
      exists: !!record,
      record,
      schedule: {
        weekday,
        isWorkingDay,
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        breakMinutes: 60,
        expectedMinutes: STANDARD_WORK_MINUTES,
      },
    };
  }

  async checkIn(authUser: AuthUser) {
    const employeeId = await this.resolveEmployeeId(authUser);
    const now = new Date();
    const today = getTodayDate();

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: { employeeId, workDate: today },
      },
    });

    if (existing) {
      throw { status: 409, message: 'You have already checked in today' };
    }

    // Determine status (PRESENT vs LATE)
    const checkInHour = now.getHours();
    const checkInMin = now.getMinutes();
    const isLate = checkInHour > STANDARD_START_HOUR || (checkInHour === STANDARD_START_HOUR && checkInMin > GRACE_MINUTES);

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        workDate: today,
        checkIn: now,
        workedMinutes: 0,
        overtimeMinutes: 0,
        status: isLate ? 'LATE' : 'PRESENT',
      },
    });

    await createAuditLog({
      action: 'CHECK_IN',
      module: 'ATTENDANCE',
      recordId: record.id,
      details: `Employee checked in at ${now.toISOString()} — Status: ${record.status}`,
      userId: authUser.userId,
    });

    return record;
  }

  async checkOut(authUser: AuthUser) {
    const employeeId = await this.resolveEmployeeId(authUser);
    const now = new Date();
    const today = getTodayDate();

    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: { employeeId, workDate: today },
      },
    });

    if (!record) {
      throw { status: 400, message: 'No check-in found for today. Please check in first.' };
    }
    if (record.checkOut) {
      throw { status: 409, message: 'You have already checked out today' };
    }
    if (!record.checkIn) {
      throw { status: 400, message: 'Check-in time is missing. Contact HR.' };
    }

    const totalDiff = diffMinutes(now, new Date(record.checkIn));
    const breakMinutes = 60; // 1 hr break
    const workedMinutes = Math.max(0, totalDiff - breakMinutes);
    const overtimeMinutes = Math.max(0, workedMinutes - STANDARD_WORK_MINUTES);

    let status = record.status;
    if (workedMinutes < STANDARD_WORK_MINUTES / 2 && workedMinutes > 0) {
      status = 'HALF_DAY';
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        workedMinutes,
        overtimeMinutes,
        status,
      },
    });

    await createAuditLog({
      action: 'CHECK_OUT',
      module: 'ATTENDANCE',
      recordId: updated.id,
      details: `Employee checked out at ${now.toISOString()} — Worked: ${workedMinutes} min`,
      userId: authUser.userId,
    });

    return updated;
  }

  async getMySummary(authUser: AuthUser, month?: string) {
    const employeeId = await this.resolveEmployeeId(authUser);

    let year = new Date().getFullYear();
    let mon = new Date().getMonth();

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const parts = month.split('-');
      year = parseInt(parts[0], 10);
      mon = parseInt(parts[1], 10) - 1;
    }

    const startDate = new Date(Date.UTC(year, mon, 1));
    const endDate = new Date(Date.UTC(year, mon + 1, 0));

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        workDate: { gte: startDate, lte: endDate },
      },
    });

    let totalWorkingDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.getUTCDay();
      if (day >= 1 && day <= 5) totalWorkingDays++;
    }

    const presentDays = records.filter((r) => r.status === 'PRESENT').length;
    const lateDays = records.filter((r) => r.status === 'LATE').length;
    const absentDays = records.filter((r) => r.status === 'ABSENT').length;
    const halfDays = records.filter((r) => r.status === 'HALF_DAY').length;
    const onLeaveDays = records.filter((r) => r.status === 'ON_LEAVE').length;

    const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.workedMinutes || 0), 0);
    const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);
    const activeDays = presentDays + lateDays;

    return {
      month: `${year}-${String(mon + 1).padStart(2, '0')}`,
      totalWorkingDays,
      presentDays,
      lateDays,
      absentDays,
      halfDays,
      onLeaveDays,
      totalWorkedHours: Math.round((totalWorkedMinutes / 60) * 10) / 10,
      totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
      averageWorkedHours: activeDays > 0 ? Math.round((totalWorkedMinutes / activeDays / 60) * 10) / 10 : 0,
    };
  }

  async getMyHistory(
    authUser: AuthUser,
    filters: { month?: string; status?: string; page?: number; limit?: number }
  ) {
    const employeeId = await this.resolveEmployeeId(authUser);
    const page = filters.page || 1;
    const limit = filters.limit || 31;
    const skip = (page - 1) * limit;

    const where: any = { employeeId };

    if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
      const [y, m] = filters.month.split('-').map(Number);
      where.workDate = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0)),
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { workDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      data: records,
      count: records.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ──────────────────────────────────────────────
  // HR / ADMIN MANAGEMENT
  // ──────────────────────────────────────────────

  async getAll(filters: {
    employeeId?: string;
    departmentId?: string;
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

    if (filters.from || filters.to) {
      where.workDate = {};
      if (filters.from) where.workDate.gte = new Date(filters.from);
      if (filters.to) where.workDate.lte = new Date(filters.to);
    }

    if (filters.status) where.status = filters.status;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
            },
          },
          correctedBy: { select: { id: true, email: true } },
        },
        orderBy: [{ workDate: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      data: records,
      count: records.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
        correctedBy: { select: { id: true, email: true } },
      },
    });

    if (!record) throw { status: 404, message: 'Attendance record not found' };
    return record;
  }

  async correct(
    id: string,
    updates: {
      checkIn?: string;
      checkOut?: string;
      status?: string;
      notes?: string;
      workedMinutes?: number;
    },
    authUser: AuthUser
  ) {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: 'Attendance record not found' };

    const data: any = {
      isManualEdit: true,
      correctedById: authUser.userId,
      correctedAt: new Date(),
    };

    if (updates.checkIn) data.checkIn = new Date(updates.checkIn);
    if (updates.checkOut) data.checkOut = new Date(updates.checkOut);
    if (updates.status) data.status = updates.status as any;
    if (updates.notes !== undefined) data.notes = updates.notes;

    const checkInTime = data.checkIn || existing.checkIn;
    const checkOutTime = data.checkOut || existing.checkOut;

    if (checkInTime && checkOutTime) {
      const diff = diffMinutes(checkOutTime, checkInTime);
      data.workedMinutes = updates.workedMinutes ?? Math.max(0, diff - 60);
    } else if (updates.workedMinutes !== undefined) {
      data.workedMinutes = updates.workedMinutes;
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data,
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true },
        },
      },
    });

    await createAuditLog({
      action: 'CORRECT',
      module: 'ATTENDANCE',
      recordId: id,
      details: `HR corrected attendance for ${updated.employee.firstName} ${updated.employee.lastName}`,
      userId: authUser.userId,
    });

    return updated;
  }

  async bulkMark(
    data: { workDate: string; employeeIds: string[]; status: string; notes?: string },
    authUser: AuthUser
  ) {
    const workDate = new Date(data.workDate);
    let created = 0;
    let skipped = 0;

    for (const employeeId of data.employeeIds) {
      const existing = await prisma.attendance.findUnique({
        where: { employeeId_workDate: { employeeId, workDate } },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.attendance.create({
        data: {
          employeeId,
          workDate,
          status: data.status as any,
          notes: data.notes,
          isManualEdit: true,
          correctedById: authUser.userId,
          correctedAt: new Date(),
        },
      });
      created++;
    }

    await createAuditLog({
      action: 'BULK_MARK',
      module: 'ATTENDANCE',
      details: `Bulk marked ${created} employees as ${data.status} on ${data.workDate}`,
      userId: authUser.userId,
    });

    return { created, skipped, total: data.employeeIds.length };
  }
}

export const attendanceService = new AttendanceService();
