export interface EmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  avatarUrl: string | null;
  jobProfile: 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  hireDate: string;
  status: string;
  employeeType: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIFSC: string | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number | null;
  status: string;
}

export interface TimeOffType {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  requiresAllocation: boolean;
  requiresApproval: boolean;
  unit: string;
  isActive: boolean;
}

export interface LeaveBalance {
  id: string;
  allocated?: number;
  consumed?: number;
  pending?: number;
  taken?: number;
  remaining?: number;
  validFrom?: string;
  validTo?: string | null;
  timeOffType?: TimeOffType;
  // Legacy / fallback fields
  leaveType?: {
    name: string;
    code?: string;
  };
  totalDays?: number;
  usedDays?: number;
  pendingDays?: number;
  year?: number;
}

export interface LeaveRequest {
  id: string;
  timeOffTypeId?: string;
  startDate: string;
  endDate: string;
  requestedUnit?: number;
  reason?: string | null;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
  timeOffType?: TimeOffType;
  reviewer?: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
  reviewNotes?: string | null;
  createdAt: string;
  // Legacy / fallback fields
  leaveType?: { name: string };
  totalDays?: number;
}

export interface Payslip {
  id: string;
  month: number;
  year: number;
  grossPay: number;
  netPay: number;
  deductions: number;
  status: string;
  paidDate: string | null;
}