import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

export class WorkingScheduleService {
  async getAll(includeInactive = false) {
    const schedules = await prisma.workingSchedule.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        days: { orderBy: { weekday: 'asc' } },
        _count: { select: { employees: true, contracts: true } },
      },
      orderBy: { name: 'asc' },
    });

    return schedules.map((s) => ({
      ...s,
      weeklyHours: this.calculateWeeklyHours(s.days),
      employeeCount: s._count.employees,
      contractCount: s._count.contracts,
    }));
  }

  async getById(id: string) {
    const schedule = await prisma.workingSchedule.findUnique({
      where: { id },
      include: {
        days: { orderBy: { weekday: 'asc' } },
        employees: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        _count: { select: { employees: true, contracts: true } },
      },
    });

    if (!schedule) return null;

    return {
      ...schedule,
      weeklyHours: this.calculateWeeklyHours(schedule.days),
      employeeCount: schedule._count.employees,
      contractCount: schedule._count.contracts,
    };
  }

  async create(data: any, authUser: AuthUser) {
    const { name, code, description, days, isActive = true } = data;

    if (!name || !code) {
      throw { status: 400, message: 'Name and code are required' };
    }

    const existingCode = await prisma.workingSchedule.findUnique({ where: { code } });
    if (existingCode) throw { status: 409, message: 'Schedule code already exists' };

    const existingName = await prisma.workingSchedule.findUnique({ where: { name } });
    if (existingName) throw { status: 409, message: 'Schedule name already exists' };

    if (!days || !Array.isArray(days) || days.length === 0) {
      throw { status: 400, message: 'At least one schedule day is required' };
    }

    const schedule = await prisma.workingSchedule.create({
      data: {
        name,
        code,
        description,
        isActive,
        days: {
          create: days.map((d: any) => ({
            weekday: d.weekday,
            startTime: new Date(`1970-01-01T${d.startTime}:00`),
            endTime: new Date(`1970-01-01T${d.endTime}:00`),
            breakMinutes: d.breakMinutes || 0,
          })),
        },
      },
      include: { days: { orderBy: { weekday: 'asc' } } },
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'WORKING_SCHEDULE',
      recordId: schedule.id,
      details: `Created working schedule: ${name} (${code})`,
      userId: authUser.userId,
    });

    return {
      ...schedule,
      weeklyHours: this.calculateWeeklyHours(schedule.days),
    };
  }

  async update(id: string, data: any, authUser: AuthUser) {
    const existing = await prisma.workingSchedule.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: 'Working schedule not found' };

    const { name, code, description, isActive, days } = data;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const schedule = await prisma.workingSchedule.update({
      where: { id },
      data: {
        ...updateData,
        days: days
          ? {
              deleteMany: {},
              create: days.map((d: any) => ({
                weekday: d.weekday,
                startTime: new Date(`1970-01-01T${d.startTime}:00`),
                endTime: new Date(`1970-01-01T${d.endTime}:00`),
                breakMinutes: d.breakMinutes || 0,
              })),
            }
          : undefined,
      },
      include: { days: { orderBy: { weekday: 'asc' } } },
    });

    await createAuditLog({
      action: 'UPDATE',
      module: 'WORKING_SCHEDULE',
      recordId: id,
      details: `Updated working schedule: ${schedule.name}`,
      userId: authUser.userId,
    });

    return {
      ...schedule,
      weeklyHours: this.calculateWeeklyHours(schedule.days),
    };
  }

  async delete(id: string, authUser: AuthUser) {
    const existing = await prisma.workingSchedule.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, contracts: true } } },
    });
    if (!existing) throw { status: 404, message: 'Working schedule not found' };

    if (existing._count.employees > 0 || existing._count.contracts > 0) {
      throw { status: 400, message: 'Cannot delete schedule with linked employees or contracts. Deactivate instead.' };
    }

    await prisma.workingScheduleDay.deleteMany({ where: { workingScheduleId: id } });
    await prisma.workingSchedule.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      module: 'WORKING_SCHEDULE',
      recordId: id,
      details: `Deleted working schedule: ${existing.name}`,
      userId: authUser.userId,
    });
  }

  private calculateWeeklyHours(days: any[]) {
    let totalMinutes = 0;
    for (const day of days) {
      const start = new Date(day.startTime);
      const end = new Date(day.endTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMin = diffMs / (1000 * 60);
      totalMinutes += Math.max(0, diffMin - (day.breakMinutes || 0));
    }
    return Number((totalMinutes / 60).toFixed(2));
  }
}

export const workingScheduleService = new WorkingScheduleService();
