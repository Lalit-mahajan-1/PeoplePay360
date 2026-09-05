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
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  jobPosition: string | null;
  jobTitle: string | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string | null;
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

export interface LeaveBalance {
  id: string;
  leaveType: {
    name: string;
    code: string;
  };
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  year: number;
}

export interface LeaveRequest {
  id: string;
  leaveType: { name: string };
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  createdAt: string;
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