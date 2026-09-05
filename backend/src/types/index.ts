// ── Re-export Prisma types for convenience ──
export type {
  User,
  Employee,
  Department,
  Attendance,
  AuditLog,
} from '@prisma/client';

export {
  UserRole,
  JobProfile,
  Gender,
  EmployeeStatus,
  EmployeeType,
  AttendanceStatus,
} from '@prisma/client';

// ── API Response Shapes ──
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
  employeeType?: string;
  search?: string;
}

// ── Dashboard Summary ──
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