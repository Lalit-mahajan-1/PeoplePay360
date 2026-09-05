import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Department {
  id: string;
  name: string;
  code: string;
  _count?: { employees: number };
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  department?: Department;
  departmentId?: string;
  jobPosition?: string;
  jobTitle?: string;
  manager?: { id: string; firstName: string; lastName: string };
  managerId?: string;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  employeeType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  city?: string;
  state?: string;
  country?: string;
  bankName?: string;
  bankAccountNo?: string;
  createdAt: string;
}

// Employee API
export const employeeApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: Employee[]; count: number }>('/employees', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Employee }>(`/employees/${id}`),

  create: (data: Partial<Employee>) =>
    api.post<{ success: boolean; data: Employee }>('/employees', data),

  update: (id: string, data: Partial<Employee>) =>
    api.put<{ success: boolean; data: Employee }>(`/employees/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/employees/${id}`),
};

// Department API
export const departmentApi = {
  getAll: () =>
    api.get<{ success: boolean; data: Department[] }>('/employees/departments'),

  create: (data: { name: string; code: string; parentId?: string }) =>
    api.post<{ success: boolean; data: Department }>('/employees/departments', data),
};

export default api;