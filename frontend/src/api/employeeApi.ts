import axios from 'axios';
import type { EmployeeProfile, LeaveBalance, LeaveRequest, Payslip } from '../types/employee.types';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Profile ──
export const getMyProfile = () =>
  API.get<{ success: boolean; data: EmployeeProfile }>('/employees/me');

export const updateMyProfile = (data: Partial<EmployeeProfile>) =>
  API.put<{ success: boolean; data: EmployeeProfile }>('/employees/me', data);
export const uploadMyAvatar = async (file: File) => {
  const body = await file.arrayBuffer();
  return API.put<{ success: boolean; data: EmployeeProfile }>('/employees/me/avatar', body, {
    headers: { 'Content-Type': file.type },
  });
};

export const deleteMyAvatar = () =>
  API.delete<{ success: boolean; data: EmployeeProfile }>('/employees/me/avatar');

// ── Attendance (ready for when you build those routes) ──
export const getMyAttendance = (month: string) =>
  API.get(`/employees/me/attendance?month=${month}`);

export const checkIn = () =>
  API.post('/employees/me/attendance/check-in');

export const checkOut = () =>
  API.post('/employees/me/attendance/check-out');

// ── Leave ──
export const getMyLeaveBalances = () =>
  API.get<{ success: boolean; data: LeaveBalance[] }>('/employees/me/leave-balances');

export const getMyLeaveRequests = () =>
  API.get<{ success: boolean; data: LeaveRequest[] }>('/employees/me/leave-requests');

export const submitLeaveRequest = (data: {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) => API.post('/employees/me/leave-requests', data);

// ── Payslips ──
export const getMyPayslips = () =>
  API.get<{ success: boolean; data: Payslip[] }>('/employees/me/payslips');

// ── Directory / All Employees ──
export const getAllEmployees = () =>
  API.get<{ success: boolean; data: EmployeeProfile[] }>('/employees');

export default API;