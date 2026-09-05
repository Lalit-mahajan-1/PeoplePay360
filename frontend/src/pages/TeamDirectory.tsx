import { useEffect, useState } from 'react';
import { getAllEmployees } from '../api/employeeApi';
import type { EmployeeProfile } from '../types/employee.types';
import toast from 'react-hot-toast';
import { Search, Mail, Phone, Briefcase } from 'lucide-react';

export default function TeamDirectory() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => { void getAllEmployees().then((res) => setEmployees((res.data as any)?.data ?? [])).catch(() => toast.error('Failed to load team directory')).finally(() => setLoading(false)); }, []);
  const filtered = employees.filter((employee) => `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.jobProfile}`.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" /></div>;
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold text-gray-900">Team Directory</h1><p className="mt-1 text-sm text-gray-500">Browse company colleagues by job profile</p></div><label className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search colleagues..." className="w-full rounded-xl border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></label></div>{filtered.length === 0 ? <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">No team members found matching &quot;{search}&quot;.</div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((employee) => <div key={employee.id} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">{employee.avatarUrl ? <img src={employee.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : `${employee.firstName[0]}${employee.lastName[0]}`}</div><div className="min-w-0"><h3 className="truncate font-bold text-gray-900">{employee.firstName} {employee.lastName}</h3><span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{employee.jobProfile.replace(/_/g, ' ')}</span></div></div><div className="space-y-2 border-t pt-3 text-xs text-gray-600"><div className="flex gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" /><span className="truncate">{employee.email}</span></div>{employee.phone && <div className="flex gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /><span>{employee.phone}</span></div>}{employee.manager && <div className="flex gap-2"><Briefcase className="h-3.5 w-3.5 text-gray-400" /><span>Manager: {employee.manager.firstName} {employee.manager.lastName}</span></div>}</div></div>)}</div>}</div>;
}

