import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Check,
  X,
  ListChecks,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CalendarDays,
  Tag,
  Award,
  ShieldCheck,
  UserCheck,
  Search,
  Filter,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

type Tab = 'requests' | 'allocations' | 'types';

const REQ_STATUS: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: 'Pending HR Review' },
  APPROVED: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: 'Approved' },
  REFUSED: { color: 'bg-red-500/10 text-red-600 border-red-200', label: 'Refused' },
  CANCELLED: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Cancelled' },
  DRAFT: { color: 'bg-blue-500/10 text-blue-600 border-blue-200', label: 'Draft' },
};

export default function TimeOffManagementPage() {
  const [tab, setTab] = useState<Tab>('requests');
  const [analytics, setAnalytics] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showAllocForm, setShowAllocForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [allocForm, setAllocForm] = useState<any>({
    employeeId: '',
    timeOffTypeId: '',
    allocated: 12,
    validFrom: new Date().getFullYear() + '-01-01',
    validTo: new Date().getFullYear() + '-12-31',
    notes: '',
  });
  const [typeForm, setTypeForm] = useState<any>({
    name: '',
    code: '',
    unit: 'DAYS',
    requiresAllocation: true,
    requiresApproval: true,
    isPaid: true,
    isActive: true,
    description: '',
  });
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [hrAnalyticsRes, r, a, t, e] = await Promise.all([
        api.get('/time-off/hr-analytics').catch(() => null),
        api.get('/time-off/requests'),
        api.get('/time-off/allocations'),
        api.get('/time-off/types?includeInactive=true'),
        api.get('/employees'),
      ]);

      if (hrAnalyticsRes?.data?.data) {
        setAnalytics(hrAnalyticsRes.data.data);
      }
      setRequests(r.data?.data || []);
      setAllocations(a.data?.data || []);
      setTypes(t.data?.data || []);
      setEmployees(e.data?.data || []);
    } catch {
      toast.error('Failed to load HR time-off management records');
    } finally {
      setLoading(false);
    }
  }

  async function approveReq(id: string) {
    try {
      const notes = reviewNotesMap[id] || undefined;
      await api.post(`/time-off/requests/${id}/approve`, { reviewNotes: notes });
      toast.success('Leave request approved successfully!');
      setReviewNotesMap((prev) => ({ ...prev, [id]: '' }));
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to approve request');
    }
  }

  async function refuseReq(id: string) {
    try {
      const notes = reviewNotesMap[id] || undefined;
      await api.post(`/time-off/requests/${id}/refuse`, { reviewNotes: notes });
      toast.success('Leave request declined');
      setReviewNotesMap((prev) => ({ ...prev, [id]: '' }));
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to decline request');
    }
  }

  async function approveAlloc(id: string) {
    try {
      await api.post(`/time-off/allocations/${id}/approve`);
      toast.success('Allocation approved');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to approve allocation');
    }
  }

  async function saveAlloc() {
    try {
      await api.post('/time-off/allocations', allocForm);
      toast.success('Allocation created successfully');
      setShowAllocForm(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create allocation');
    }
  }

  async function saveType() {
    try {
      await api.post('/time-off/types', typeForm);
      toast.success('Time off type created');
      setShowTypeForm(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create type');
    }
  }

  const summary = analytics?.summary || {
    pendingCount: requests.filter((r) => r.status === 'PENDING').length,
    approvedCount: requests.filter((r) => r.status === 'APPROVED').length,
    refusedCount: requests.filter((r) => r.status === 'REFUSED').length,
    onLeaveTodayCount: 0,
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`;
    const code = r.employee?.employeeCode || '';
    const typeName = r.timeOffType?.name || '';
    const matchesSearch =
      searchQuery.trim() === '' ||
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      typeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1500px] mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Dedicated HR Management Portal
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Time Off Admin & Request Approvals
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review incoming employee leave applications, configure leave types, and manage annual allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'allocations' && (
            <button
              onClick={() => setShowAllocForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Allocation
            </button>
          )}
          {tab === 'types' && (
            <button
              onClick={() => setShowTypeForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Time Off Type
            </button>
          )}
        </div>
      </div>

      {/* HR Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{summary.pendingCount}</div>
          <p className="text-xs text-amber-700/80 font-medium">Awaiting HR action</p>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <span>On Leave Today</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{summary.onLeaveTodayCount}</div>
          <p className="text-xs text-emerald-700/80 font-medium">Employees currently away</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Total Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{summary.approvedCount}</div>
          <p className="text-xs text-gray-500 font-medium">Approved leave requests</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Total Declined</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-800">{summary.refusedCount}</div>
          <p className="text-xs text-gray-500 font-medium">Refused applications</p>
        </div>
      </div>

      {/* Main Tabs Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-100 bg-gray-50/50 px-6 overflow-x-auto">
          {[
            { id: 'requests', label: `Incoming Requests (${summary.pendingCount} pending)`, icon: Clock },
            { id: 'allocations', label: 'Employee Allocations', icon: Award },
            { id: 'types', label: 'Time Off Types', icon: Tag },
          ].map((t) => {
            const Icon = t.icon as any;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-2 py-4 px-3 text-sm font-bold border-b-2 -mb-px transition whitespace-nowrap cursor-pointer ${
                  active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8">
          {tab === 'requests' && (
            <div className="space-y-4">
              {/* Filter & Search Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by employee name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 overflow-x-auto">
                  {['PENDING', 'ALL', 'APPROVED', 'REFUSED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        filterStatus === st
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {st === 'PENDING' ? 'Pending Review' : st === 'ALL' ? 'All History' : st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">No leave requests match the selected filter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((r) => {
                    const statusInfo = REQ_STATUS[r.status] || { color: 'bg-gray-100 text-gray-700', label: r.status };
                    const isPending = r.status === 'PENDING';

                    return (
                      <div
                        key={r.id}
                        className={`rounded-2xl border p-5 transition hover:shadow-xs ${
                          isPending ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-[240px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-base">
                                {r.employee?.firstName} {r.employee?.lastName}
                              </span>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                {r.employee?.employeeCode}
                              </span>
                              {r.employee?.department?.name && (
                                <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full">
                                  {r.employee.department.name}
                                </span>
                              )}
                              <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-gray-400" />
                                <strong>{r.timeOffType?.name}</strong> ({r.timeOffType?.code})
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                {r.startDate ? String(r.startDate).slice(0, 10) : ''} → {r.endDate ? String(r.endDate).slice(0, 10) : ''}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <strong className="text-gray-900">{Number(r.requestedUnit)}</strong>{' '}
                                {r.timeOffType?.unit === 'HOURS' ? 'hrs' : 'days'}
                              </span>
                            </div>

                            {r.reason && (
                              <div className="text-xs text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 italic">
                                "{r.reason}"
                              </div>
                            )}
                          </div>

                          {/* Action Controls for HR */}
                          {isPending ? (
                            <div className="flex flex-col gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                              <input
                                value={reviewNotesMap[r.id] || ''}
                                onChange={(e) => setReviewNotesMap({ ...reviewNotesMap, [r.id]: e.target.value })}
                                placeholder="Add note for employee (optional)"
                                className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 min-w-[240px] bg-white"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => approveReq(r.id)}
                                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex-1"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Approve
                                </button>
                                <button
                                  onClick={() => refuseReq(r.id)}
                                  className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex-1"
                                >
                                  <XCircle className="w-4 h-4" /> Decline
                                </button>
                              </div>
                            </div>
                          ) : (
                            r.reviewNotes && (
                              <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100 max-w-xs shrink-0">
                                <div className="font-bold text-gray-700 mb-0.5">HR Review Note:</div>
                                <div>"{r.reviewNotes}"</div>
                                {r.reviewer?.email && (
                                  <div className="text-[10px] text-gray-400 mt-1">Reviewed by {r.reviewer.email}</div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'allocations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3 text-right">Allocated</th>
                    <th className="px-4 py-3 text-right">Consumed</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3">Validity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allocations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        No allocations configured
                      </td>
                    </tr>
                  )}
                  {allocations.map((a) => {
                    const all = Number(a.allocated || 0);
                    const used = Number(a.consumed || 0);
                    const rem = Math.max(0, all - used);
                    const unitLabel = a.timeOffType?.unit === 'HOURS' ? 'hrs' : 'days';

                    return (
                      <tr key={a.id} className="hover:bg-gray-50/30">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900">
                            {a.employee?.firstName} {a.employee?.lastName}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{a.employee?.employeeCode}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-800">
                          {a.timeOffType?.name} ({a.timeOffType?.code})
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          {all} {unitLabel}
                        </td>
                        <td className="px-4 py-3.5 text-right text-red-600 font-semibold">
                          {used} {unitLabel}
                        </td>
                        <td className="px-4 py-3.5 text-right text-emerald-600 font-bold">
                          {rem} {unitLabel}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {String(a.validFrom).slice(0, 10)}
                          <br />
                          {a.validTo ? 'to ' + String(a.validTo).slice(0, 10) : '∞'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                              a.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                : 'bg-amber-500/10 text-amber-600 border-amber-200'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {a.status !== 'APPROVED' && (
                            <button
                              onClick={() => approveAlloc(a.id)}
                              className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'types' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.length === 0 && <div className="col-span-full text-center py-16 text-gray-400">No time off types configured</div>}
              {types.map((t) => (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition ${
                    t.isActive ? 'border-gray-100 bg-white hover:shadow-sm' : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{t.name}</h3>
                      <p className="font-mono text-xs text-gray-400">{t.code}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  {t.description && <p className="text-xs text-gray-600 mb-3">{t.description}</p>}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{t.unit}</span>
                    {t.requiresAllocation && <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-semibold">Allocation</span>}
                    {t.requiresApproval && <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">Approval Req</span>}
                    {t.isPaid ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">Paid</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">Unpaid</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Allocation Modal */}
      {showAllocForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAllocForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">New Leave Allocation</h2>
              <button onClick={() => setShowAllocForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Employee *</label>
                <select
                  value={allocForm.employeeId}
                  onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Leave Type *</label>
                <select
                  value={allocForm.timeOffTypeId}
                  onChange={(e) => setAllocForm({ ...allocForm, timeOffTypeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                >
                  <option value="">Select Leave Type...</option>
                  {types
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Units *</label>
                  <input
                    type="number"
                    value={allocForm.allocated}
                    onChange={(e) => setAllocForm({ ...allocForm, allocated: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Valid From *</label>
                  <input
                    type="date"
                    value={allocForm.validFrom}
                    onChange={(e) => setAllocForm({ ...allocForm, validFrom: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Valid To</label>
                  <input
                    type="date"
                    value={allocForm.validTo}
                    onChange={(e) => setAllocForm({ ...allocForm, validTo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={allocForm.notes}
                  onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAllocForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={saveAlloc} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
                Create Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Time Off Type Modal */}
      {showTypeForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTypeForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">New Time Off Type</h2>
              <button onClick={() => setShowTypeForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Name *</label>
                  <input
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Sick Leave"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Code *</label>
                  <input
                    value={typeForm.code}
                    onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                    placeholder="SL"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Unit</label>
                <select
                  value={typeForm.unit}
                  onChange={(e) => setTypeForm({ ...typeForm, unit: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                >
                  <option value="DAYS">Days</option>
                  <option value="HOURS">Hours</option>
                </select>
              </div>
              {[
                { k: 'requiresAllocation', l: 'Requires Balance Allocation' },
                { k: 'requiresApproval', l: 'Requires Approval Workflow' },
                { k: 'isPaid', l: 'Is Paid Time Off' },
                { k: 'isActive', l: 'Type Is Active' },
              ].map((o) => (
                <label key={o.k} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(typeForm as any)[o.k]}
                    onChange={(e) => setTypeForm({ ...typeForm, [o.k]: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{o.l}</span>
                </label>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowTypeForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={saveType} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
                Create Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
