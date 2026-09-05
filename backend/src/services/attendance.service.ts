import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const WEEKDAY_MAP = WEEKDAYS;
const GRACE_MINUTES = 15;
const STANDARD_WORK_MINUTES = 480; // 8 hours
const STANDARD_BREAK_MINUTES = 60;
const STANDARD_START_MINUTES = 9 * 60;
const BUSINESS_TIME_ZONE = process.env.ATTENDANCE_TIME_ZONE || 'Asia/Kolkata';

type ScheduleContext = {
  weekday: (typeof WEEKDAYS)[number];
  isWorkingDay: boolean;
  startMinutes: number;
  endMinutes: number;
  breakMinutes: number;
  expectedMinutes: number;
};

function businessParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') };
}

function getTodayDate(): Date {
  const { year, month, day } = businessParts(new Date());
  return new Date(Date.UTC(year, month - 1, day));
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function timeToMinutes(time: Date): number {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

export class AttendanceService {
  private async getScheduleContext(employeeId: string, workDate: Date): Promise<ScheduleContext> {
    const weekday = WEEKDAYS[workDate.getUTCDay()];
    const contract = await prisma.contract.findFirst({
      where: {
        employeeId,
        status: 'ACTIVE',
        startDate: { lte: workDate },
        OR: [{ endDate: null }, { endDate: { gte: workDate } }],
      },
      orderBy: { startDate: 'desc' },
      include: { workingSchedule: { include: { days: { where: { weekday } } } } },
    });

    const employeeSchedule = contract?.workingSchedule
      ? null
      : await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { workingSchedule: { include: { days: { where: { weekday } } } } },
      });
    const schedule = contract?.workingSchedule || employeeSchedule?.workingSchedule;
    const scheduleDay = schedule?.days[0];

    if (schedule) {
      if (!scheduleDay) {
        return { weekday, isWorkingDay: false, startMinutes: 0, endMinutes: 0, breakMinutes: 0, expectedMinutes: 0 };
      }
      const startMinutes = timeToMinutes(scheduleDay.startTime);
      let endMinutes = timeToMinutes(scheduleDay.endTime);
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;
      const expectedMinutes = Math.max(0, endMinutes - startMinutes - scheduleDay.breakMinutes);
      return { weekday, isWorkingDay: expectedMinutes > 0, startMinutes, endMinutes, breakMinutes: scheduleDay.breakMinutes, expectedMinutes };
    }

    const isWorkingDay = workDate.getUTCDay() >= 1 && workDate.getUTCDay() <= 5;
    return {
      weekday,
      isWorkingDay,
      startMinutes: STANDARD_START_MINUTES,
      endMinutes: STANDARD_START_MINUTES + STANDARD_WORK_MINUTES + STANDARD_BREAK_MINUTES,
      breakMinutes: STANDARD_BREAK_MINUTES,
      expectedMinutes: isWorkingDay ? STANDARD_WORK_MINUTES : 0,
    };
  }

  private calculateHours(checkIn: Date, checkOut: Date, schedule: ScheduleContext) {
    const workedMinutes = Math.max(0, diffMinutes(checkOut, checkIn) - schedule.breakMinutes);
    return {
      workedMinutes,
      overtimeMinutes: Math.max(0, workedMinutes - schedule.expectedMinutes),
      status: workedMinutes > 0 && schedule.expectedMinutes > 0 && workedMinutes < schedule.expectedMinutes / 2 ? 'HALF_DAY' : undefined,
    };
  }

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
    const schedule = await this.getScheduleContext(employeeId, today);

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
        ...schedule,
        startTime: `${String(Math.floor(schedule.startMinutes / 60) % 24).padStart(2, '0')}:${String(schedule.startMinutes % 60).padStart(2, '0')}`,
        endTime: `${String(Math.floor(schedule.endMinutes / 60) % 24).padStart(2, '0')}:${String(schedule.endMinutes % 60).padStart(2, '0')}`,
      },
    };
  }

  async checkIn(authUser: AuthUser) {
    const employeeId = await this.resolveEmployeeId(authUser);
    const now = new Date();
    const today = getTodayDate();
    const schedule = await this.getScheduleContext(employeeId, today);

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: { employeeId, workDate: today },
      },
    });

    if (existing) {
      if (!existing.checkOut) {
        throw { status: 409, message: 'You are already checked in' };
      }

      // Re-check-in after previous checkout on the same day
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          checkOut: null, // Clear checkOut to resume working session
        },
      });

      await createAuditLog({
        action: 'CHECK_IN',
        module: 'ATTENDANCE',
        recordId: updated.id,
        details: `Employee re-checked in at ${now.toISOString()} (Resumed active session)`,
        userId: authUser.userId,
      });

      return updated;
    }

    // Determine status (PRESENT vs LATE)
    const businessTime = businessParts(now);
    const isLate = businessTime.hour * 60 + businessTime.minute > schedule.startMinutes + GRACE_MINUTES;

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
    const schedule = await this.getScheduleContext(employeeId, today);

    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: { employeeId, workDate: today },
      },
    });

    if (!record) {
      throw { status: 400, message: 'No check-in found for today. Please check in first.' };
    }
    if (record.checkOut) {
      throw { status: 409, message: 'You have already checked out today. Click Check In Again to start a new session.' };
    }
    if (!record.checkIn) {
      throw { status: 400, message: 'Check-in time is missing. Contact HR.' };
    }

    // Calculate session worked minutes and accumulate with previous worked minutes
    const sessionMinutes = Math.max(0, diffMinutes(now, new Date(record.checkIn)));
    const previousWorkedMinutes = Number(record.workedMinutes || 0);
    const totalWorkedMinutes = previousWorkedMinutes + sessionMinutes;

    const expectedMinutes = schedule.expectedMinutes || 480;
    const overtimeMinutes = Math.max(0, totalWorkedMinutes - expectedMinutes);

    let status = record.status;
    if (totalWorkedMinutes >= expectedMinutes && status !== 'LATE') {
      status = 'PRESENT';
    } else if (totalWorkedMinutes > 0 && totalWorkedMinutes < expectedMinutes / 2) {
      status = 'HALF_DAY';
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        workedMinutes: totalWorkedMinutes,
        overtimeMinutes,
        status,
      },
    });

    await createAuditLog({
      action: 'CHECK_OUT',
      module: 'ATTENDANCE',
      recordId: updated.id,
      details: `Employee checked out at ${now.toISOString()} — Worked: ${totalWorkedMinutes} min`,
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
    search?: string;
    date?: string;
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    const employeeWhere: any = {};
    const search = filters.search?.trim();
    const searchIsDate = Boolean(search && /^\d{4}-\d{2}-\d{2}$/.test(search));
    if (search && !searchIsDate) {
      employeeWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(employeeWhere).length) where.employee = employeeWhere;

    if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
      where.workDate = new Date(`${filters.date}T00:00:00.000Z`);
    } else if (searchIsDate && search) {
      where.workDate = new Date(`${search}T00:00:00.000Z`);
    }

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
            },
          },
          correctedBy: { select: { id: true, email: true } },
        },
        orderBy: [{ workDate: 'desc' }, { updatedAt: 'desc' }],
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
      overtimeMinutes?: number;
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

    const schedule = await this.getScheduleContext(existing.employeeId, existing.workDate);
    const checkInTime = data.checkIn || existing.checkIn;
    const checkOutTime = data.checkOut || existing.checkOut;

    if (checkInTime && checkOutTime) {
      const calculated = this.calculateHours(checkInTime, checkOutTime, schedule);
      data.workedMinutes = updates.workedMinutes ?? calculated.workedMinutes;
      data.overtimeMinutes = updates.overtimeMinutes ?? Math.max(0, data.workedMinutes - schedule.expectedMinutes);
      if (!updates.status && calculated.status) data.status = calculated.status;
    } else if (updates.workedMinutes !== undefined) {
      data.workedMinutes = updates.workedMinutes;
      data.overtimeMinutes = updates.overtimeMinutes ?? Math.max(0, updates.workedMinutes - schedule.expectedMinutes);
    } else if (updates.overtimeMinutes !== undefined) {
      data.overtimeMinutes = updates.overtimeMinutes;
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

  // ──────────────────────────────────────────────
  //  PAYROLL AGGREGATION (called by payroll engine)
  // ──────────────────────────────────────────────

  async getPayrollAggregation(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        workDate: { gte: periodStart, lte: periodEnd },
      },
    });

    const workedHours = records.reduce(
      (sum, r) => sum + r.workedMinutes, 0
    ) / 60;

    const overtimeHours = records.reduce(
      (sum, r) => sum + r.overtimeMinutes, 0
    ) / 60;

    const lateRecords = records.filter((r) => r.status === 'LATE');
    // Each late record: calculate how late based on schedule
    // For simplicity, each LATE = 0.5 hr deduction unless corrected
    const lateHours = lateRecords.length * 0.5;

    const absentDays = records.filter(
      (r) => r.status === 'ABSENT'
    ).length;

    const workedDays = records.filter(
      (r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)
    ).length;

    const halfDays = records.filter(
      (r) => r.status === 'HALF_DAY'
    ).length;

    const holidayHours = records
      .filter((r) => r.status === 'HOLIDAY' && r.workedMinutes > 0)
      .reduce((sum, r) => sum + r.workedMinutes, 0) / 60;

    const missingCheckouts = records.filter(
      (r) => r.checkIn && !r.checkOut
    ).length;

    // Calculate expected days from schedule
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { workingScheduleId: true },
    });

    let expectedDaysPerMonth = 0;
    let expectedHoursPerMonth = 0;

    if (employee?.workingScheduleId) {
      const scheduleDays = await prisma.workingScheduleDay.findMany({
        where: { workingScheduleId: employee.workingScheduleId },
      });
      const workingWeekdays = new Set(scheduleDays.map((d) => d.weekday));
      const avgMinutesPerDay = scheduleDays.reduce((sum, d) => {
        const start = d.startTime.getHours() * 60 + d.startTime.getMinutes();
        const end = d.endTime.getHours() * 60 + d.endTime.getMinutes();
        return sum + Math.max(0, end - start - d.breakMinutes);
      }, 0) / Math.max(1, scheduleDays.length);

      // Count working days in the period
      for (
        let d = new Date(periodStart);
        d <= periodEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const wd = WEEKDAY_MAP[d.getDay()];
        if (workingWeekdays.has(wd as any)) {
          expectedDaysPerMonth++;
        }
      }

      expectedHoursPerMonth = (expectedDaysPerMonth * avgMinutesPerDay) / 60;
    } else {
      // Default: Mon-Fri, 8 hrs/day
      for (
        let d = new Date(periodStart);
        d <= periodEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const day = d.getDay();
        if (day >= 1 && day <= 5) {
          expectedDaysPerMonth++;
        }
      }
      expectedHoursPerMonth = expectedDaysPerMonth * 8;
    }

    return {
      workedHours: Math.round(workedHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      lateHours: Math.round(lateHours * 100) / 100,
      absentDays,
      workedDays: workedDays + halfDays * 0.5,
      holidayHours: Math.round(holidayHours * 100) / 100,
      missingCheckouts,
      expectedDaysPerMonth,
      expectedHoursPerMonth: Math.round(expectedHoursPerMonth * 100) / 100,
      totalRecords: records.length,
    };
  }


  async createMedicalAbsence(
    data: { employeeId: string; workDate: string; notes: string },
    authUser: AuthUser
  ) {
    const workDate = new Date(`${data.workDate}T00:00:00.000Z`);
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw { status: 404, message: 'Employee not found' };

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_workDate: { employeeId: data.employeeId, workDate } },
    });
    if (existing) {
      throw { status: 409, message: 'An attendance record already exists for this employee and date' };
    }
    const record = await prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        workDate,
        status: 'HOLIDAY',
        notes: data.notes.trim(),
        isManualEdit: true,
        correctedById: authUser.userId,
        correctedAt: new Date(),
      },
    });

    await createAuditLog({
      action: 'MEDICAL_ABSENCE', module: 'ATTENDANCE', recordId: record.id,
      details: `Recorded medical absence for ${employee.firstName} ${employee.lastName} on ${data.workDate}`,
      userId: authUser.userId,
    });
    return record;
  }

  async delete(id: string, authUser: AuthUser) {
    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });
    if (!existing) throw { status: 404, message: 'Attendance record not found' };

    await prisma.attendance.delete({ where: { id } });
    await createAuditLog({
      action: 'DELETE',
      module: 'ATTENDANCE',
      recordId: id,
      details: `Deleted attendance for ${existing.employee.firstName} ${existing.employee.lastName} (${existing.employee.employeeCode}) on ${existing.workDate.toISOString().slice(0, 10)}`,
      userId: authUser.userId,
    });
  }

  async closeDay(workDateInput: string | undefined, authUser: AuthUser) {
    const workDate = workDateInput
      ? new Date(`${workDateInput}T00:00:00.000Z`)
      : getTodayDate();
    const contracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: workDate },
        OR: [{ endDate: null }, { endDate: { gte: workDate } }],
        employee: { status: 'ACTIVE' },
      },
      select: { employeeId: true },
    });
    let created = 0;
    for (const employeeId of new Set(contracts.map((contract) => contract.employeeId))) {
      const schedule = await this.getScheduleContext(employeeId, workDate);
      if (!schedule.isWorkingDay) continue;
      const result = await prisma.attendance.createMany({
        data: [{ employeeId, workDate, status: 'ABSENT', notes: 'Automatically marked absent at end of day' }],
        skipDuplicates: true,
      });
      created += result.count;
    }
    await createAuditLog({
      action: 'CLOSE_DAY', module: 'ATTENDANCE',
      details: `End-of-day absence check completed for ${workDate.toISOString().slice(0, 10)}; ${created} absences created`,
      userId: authUser.userId,
    });
    return { workDate, created, eligibleEmployees: new Set(contracts.map((contract) => contract.employeeId)).size };
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
