import { useEffect, useState } from 'react';
import { getAllEmployees } from '../api/employeeApi';
import type { EmployeeProfile } from '../types/employee.types';
import toast from 'react-hot-toast';
import { Search, Mail, Phone, Briefcase } from 'lucide-react';

export default function TeamDirectory() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    try {
      const res = await getAllEmployees();
      const data = (res.data as any)?.data ?? res.data;
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load team directory');
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter((e) => {
    const query = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(query) ||
      e.lastName.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query) ||
      (e.department?.name || '').toLowerCase().includes(query) ||
      (e.jobTitle || e.jobPosition || '').toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Browse company colleagues and department structure</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search colleagues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          No team members found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((emp) => (
            <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg shrink-0">
                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${emp.firstName[0]}${emp.lastName[0]}`
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-xs text-gray-500 truncate">{emp.jobTitle || emp.jobPosition || 'Employee'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded-full">
                    {emp.department?.name || 'General'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.manager && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Manager: {emp.manager.firstName} {emp.manager.lastName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
