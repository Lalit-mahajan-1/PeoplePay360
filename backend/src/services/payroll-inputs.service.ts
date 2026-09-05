import prisma from '../lib/prisma';
import { attendanceService } from './attendance.service';
import { timeOffService } from './time-off.service';
import { PayrollInputs } from '../types';

export class PayrollInputsService {
    /**
     * Build the complete PayrollInputs object for one employee + one period.
     * This is the single data-gathering step before the Rule Engine runs.
     */
    async buildInputs(
        employeeId: string,
        periodStart: Date,
        periodEnd: Date
    ): Promise<PayrollInputs | null> {
        // 1. Fetch employee
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: { select: { id: true, name: true } },
            },
        });

        if (!employee || employee.status === 'ARCHIVED') {
            return null;
        }

        // 2. Fetch the ACTIVE contract that covers this period
        const contract = await prisma.contract.findFirst({
            where: {
                employeeId,
                status: 'ACTIVE',
                startDate: { lte: periodEnd },
                OR: [
                    { endDate: { gte: periodStart } },
                    { endDate: null },
                ],
            },
            orderBy: { startDate: 'desc' },
            include: {
                salaryStructure: {
                    include: {
                        rules: {
                            include: { salaryRule: true },
                            orderBy: { sequence: 'asc' },
                        },
                    },
                },
                workingSchedule: {
                    include: { days: true },
                },
            },
        });

        if (!contract) {
            // No active contract for this period — payroll can't compute
            return null;
        }

        const wage = Number(contract.wage);

        // 3. Attendance aggregation
        const attendance = await attendanceService.getPayrollAggregation(
            employeeId,
            periodStart,
            periodEnd
        );

        // 4. Leave aggregation
        const leave = await timeOffService.getPayrollLeaveAggregation(
            employeeId,
            periodStart,
            periodEnd
        );

        // 5. Calculate rates
        const expectedDays = attendance.expectedDaysPerMonth || 22;
        const expectedHours = attendance.expectedHoursPerMonth || 176;
        const hourlyRate = expectedHours > 0 ? wage / expectedHours : 0;
        const dailyRate = expectedDays > 0 ? wage / expectedDays : 0;

        return {
            employeeId: employee.id,
            employeeCode: employee.employeeCode,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            contractId: contract.id,
            contractWage: wage,
            currencyCode: contract.currencyCode,
            periodStart,
            periodEnd,

            expectedHoursPerMonth: expectedHours,
            expectedDaysPerMonth: expectedDays,
            hourlyRate: Math.round(hourlyRate * 100) / 100,
            dailyRate: Math.round(dailyRate * 100) / 100,

            workedHours: attendance.workedHours,
            overtimeHours: attendance.overtimeHours,
            lateHours: attendance.lateHours,
            absentDays: attendance.absentDays,
            workedDays: attendance.workedDays,
            holidayHours: attendance.holidayHours,
            missingCheckouts: attendance.missingCheckouts,

            paidLeaveDays: leave.paidLeaveDays,
            unpaidLeaveDays: leave.unpaidLeaveDays,
            onLeaveDays: leave.onLeaveDays,
        };
    }
}

export const payrollInputsService = new PayrollInputsService();