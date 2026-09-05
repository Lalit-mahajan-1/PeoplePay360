// ── Re-export Prisma types ──
export type {
  User,
  Employee,
  Department,
  Attendance,
  AuditLog,
  Contract,
  WorkingSchedule,
  WorkingScheduleDay,
  SalaryRule,
  SalaryStructure,
  SalaryStructureRule,
  Payrun,
  Payslip,
  PayslipLine,
  PayrollWarning,
  LeaveRequest,
  LeaveAllocation,
  TimeOffType,
} from '@prisma/client';

export {
  UserRole,
  Gender,
  EmployeeStatus,
  EmployeeType,
  AttendanceStatus,
  SalaryRuleCategory,
  SalaryRuleComputation,
  SalaryRuleInputSource,
  PayrunStatus,
  PayslipStatus,
  ContractStatus,
  LeaveRequestStatus,
  LeaveAllocationStatus,
} from '@prisma/client';

// ── API Response ──
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// ── Pagination ──
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ── Employee Filters ──
export interface EmployeeFilters {
  status?: string;
  departmentId?: string;
  employeeType?: string;
  search?: string;
}

// ── Payroll Inputs (fed to the Rule Engine) ──
export interface PayrollInputs {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  contractId: string;
  contractWage: number;
  currencyCode: string;
  periodStart: Date;
  periodEnd: Date;

  // From Working Schedule
  expectedHoursPerMonth: number;
  expectedDaysPerMonth: number;
  hourlyRate: number;
  dailyRate: number;

  // From Attendance Aggregation
  workedHours: number;
  overtimeHours: number;
  lateHours: number;
  absentDays: number;
  workedDays: number;
  holidayHours: number;
  missingCheckouts: number;

  // From Leave Aggregation
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  onLeaveDays: number;
}

// ── Rule Engine Execution Context ──
export interface RuleExecutionContext {
  inputs: PayrollInputs;
  computedValues: Record<string, number>;
  lines: PayslipLineResult[];
}

export interface PayslipLineResult {
  salaryRuleId: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
  explanation: string;
}

// ── Payroll Warning ──
export interface PayrollWarningInput {
  payrunId?: string;
  payslipId?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  code: string;
  message: string;
}

// ── Dashboard ──
export interface EmployeeDashboardData {
  profile: any;
  attendanceSummary: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    totalWorkedHours: number;
  };
  leaveBalances: Array<{
    leaveType: string;
    total: number;
    used: number;
    remaining: number;
  }>;
  recentPayslips: any[];
}