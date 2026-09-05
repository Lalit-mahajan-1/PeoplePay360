import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import EmployeeFormModal from './EmployeeFormModal';

interface Department {
  id: string;
  name: string;
}

interface Employee {
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
  country?: string;
  bankName?: string;
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  ACTIVE: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  INACTIVE: { color: 'text-red-700', bg: 'bg-red-50' },
  ARCHIVED: { color: 'text-gray-600', bg: 'bg-gray-100' },
};

const typeLabels: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export default function EmployeeList() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const canCreate = hasRole(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']);
  const canEdit = hasRole(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']);
  const canDelete = hasRole(['ADMIN', 'HR_PAYROLL_MANAGER']);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/employees', { params });
      setEmployees(response.data.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Archive ${emp.firstName} ${emp.lastName}?`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Employee archived');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleSaved = () => {
    handleModalClose();
    fetchEmployees();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-lg">Loading employees...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-72"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <span className="text-sm text-gray-500">{employees.length} total</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              ▦ Kanban
            </button>
          </div>
          {canCreate && (
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Employee
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {employees.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No employees found</h3>
          <p className="text-gray-500 text-sm">
            {search || statusFilter ? 'Try adjusting your filters' : 'Get started by adding your first employee'}
          </p>
        </div>
      ) : view === 'list' ? (
        /* List View */
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Position</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hire Date</th>
                {(canEdit || canDelete) && (
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {emp.employeeCode}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{emp.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{emp.jobPosition || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {typeLabels[emp.employeeType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        statusConfig[emp.status]?.bg
                      } ${statusConfig[emp.status]?.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(emp.hireDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && emp.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Archive"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['ACTIVE', 'INACTIVE', 'ARCHIVED'].map((status) => {
            const filtered = employees.filter((e) => e.status === status);
            const config = statusConfig[status];
            return (
              <div key={status} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.bg} border-2 ${config.color}`} />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {status}
                  </h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {filtered.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {filtered.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => canEdit && handleEdit(emp)}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{emp.jobPosition || 'No position'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {emp.department?.name || 'No dept'}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {typeLabels[emp.employeeType]}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No employees</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}