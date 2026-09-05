import React, { useEffect, useState } from 'react';
import {
  getMyTimeOffAnalytics,
  getLeaveTypes,
  submitLeaveRequest,
  cancelLeaveRequest,
} from '../api/employeeApi';
import type { LeaveBalance, LeaveRequest, TimeOffType } from '../types/employee.types';
import toast from 'react-hot-toast';
import {
  Plus,
  Clock,
  CalendarDays,
  Tag,
  AlertCircle,
  Ban,
  X,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Search,
  ChevronRight,
  Filter,
} from 'lucide-react';

const REQ_STATUS: Record<string, { color: string; label: string; icon: any }> = {
  PENDING: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: 'Pending HR Approval', icon: Clock },
  APPROVED: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: 'Approved by HR', icon: CheckCircle2 },
  REFUSED: { color: 'bg-red-500/10 text-red-600 border-red-200', label: 'Refused by HR', icon: XCircle },
  CANCELLED: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Cancelled', icon: Ban },
  DRAFT: { color: 'bg-blue-500/10 text-blue-600 border-blue-200', label: 'Draft', icon: Clock },
};

export default function MyLeaves() {
  const [analytics, setAnalytics] = useState<{
    summary: {
      totalRequests: number;
      pendingRequests: number;
      approvedRequests: number;
      refusedRequests: number;
      cancelledRequests: number;
      totalAllocated: number;
      totalConsumed: number;
      totalPending: number;
      totalRemaining: number;
    };
    allocations: LeaveBalance[];
    requests: LeaveRequest[];
  } | null>(null);

  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [formData, setFormData] = useState({
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, typesRes] = await Promise.allSettled([
        getMyTimeOffAnalytics(),
        getLeaveTypes(),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        const data = (analyticsRes.value.data as any)?.data ?? analyticsRes.value.data;
        setAnalytics(data);
      }
      if (typesRes.status === 'fulfilled') {
        const data = (typesRes.value.data as any)?.data ?? typesRes.value.data;
        const activeTypes = Array.isArray(data) ? data.filter((t: TimeOffType) => t.isActive) : [];
        setTypes(activeTypes);
        if (activeTypes.length > 0 && !formData.timeOffTypeId) {
          setFormData((prev) => ({ ...prev, timeOffTypeId: activeTypes[0].id }));
        }
      }
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.timeOffTypeId) {
      toast.error('Please select a leave type');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date cannot be earlier than start date');
      return;
    }

    const requestedUnit = calculateDays(formData.startDate, formData.endDate);

    setSubmitting(true);
    try {
      await submitLeaveRequest({
        timeOffTypeId: formData.timeOffTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        requestedUnit,
        reason: formData.reason,
      });
      toast.success('Leave application submitted directly to HR Manager!');
      setShowModal(false);
      setFormData({
        timeOffTypeId: types[0]?.id || '',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await cancelLeaveRequest(id);
      toast.success('Leave request cancelled');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const requestsList = analytics?.requests || [];
  const filteredRequests = requestsList.filter((r) => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const typeName = r.timeOffType?.name || '';
    const reasonText = r.reason || '';
    const matchesSearch =
      searchQuery.trim() === '' ||
      typeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reasonText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedType = types.find((t) => t.id === formData.timeOffTypeId);
  const calculatedUnits = calculateDays(formData.startDate, formData.endDate);
  const summary = analytics?.summary || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    refusedRequests: 0,
    cancelledRequests: 0,
    totalAllocated: 0,
    totalConsumed: 0,
    totalPending: 0,
    totalRemaining: 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Employee Portal • HR Workflow Connected
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Time Off & Leaves
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track leave balances, submit leave applications to HR Managers, and monitor review responses.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* KPI Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Total Submitted</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{summary.totalRequests}</div>
          <p className="text-xs text-gray-500 font-medium">Leave applications sent</p>
        </div>

        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
            <span>Pending HR Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{summary.pendingRequests}</div>
          <p className="text-xs text-amber-700/80 font-medium">Awaiting HR Manager approval</p>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <span>Approved Applications</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{summary.approvedRequests}</div>
          <p className="text-xs text-emerald-700/80 font-medium">Granted by HR Managers</p>
        </div>

        <div className="bg-blue-50/40 rounded-2xl p-5 border border-blue-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wider">
            <span>Available Balance</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-700">{Math.min(30, summary.totalRemaining)} Days</div>
          <p className="text-xs text-blue-600/80 font-medium">Standard annual allowance (max 30 days)</p>
        </div>
      </div>

      {/* Clean Leave Balances Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Leave Balances & Allocation
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Allocated annually by HR Management (atmost 30 days/yr standard)</p>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
            {analytics?.allocations?.length || 0} Categories Assigned
          </span>
        </div>

        {!analytics?.allocations || analytics.allocations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">No leave allocations assigned yet</p>
            <p className="text-xs text-gray-400 mt-1">Please contact your HR Manager for leave allocations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4 text-center">Allocated</th>
                  <th className="py-3 px-4 text-center">Used / Consumed</th>
                  <th className="py-3 px-4 text-center">Pending Review</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.allocations.map((a) => {
                  const typeName = a.timeOffType?.name || a.leaveType?.name || 'Leave';
                  const typeCode = a.timeOffType?.code || a.leaveType?.code || '';
                  const isHours = a.timeOffType?.unit === 'HOURS';
                  const unitLabel = isHours ? 'hrs' : 'days';
                  const allocated = Number(a.allocated || 0);
                  const used = Number(a.taken ?? a.consumed ?? 0);
                  const pending = Number(a.pending || 0);
                  const remaining = Number(a.remaining ?? (allocated - used - pending));

                  // Convert hours to day equivalent if unit is HOURS (8 hrs = 1 workday)
                  const dayEq = isHours ? Math.round(remaining / 8) : remaining;
                  const displayRemaining = isHours ? `${remaining} hrs (${dayEq} days)` : `${remaining} days`;

                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{typeName}</span>
                          {typeCode && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                              {typeCode}
                            </span>
                          )}
                          {a.timeOffType?.isPaid && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Paid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                        {allocated} {unitLabel} {isHours ? `(${Math.round(allocated / 8)}d)` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-600">
                        {used} {unitLabel}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                        {pending} {unitLabel}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 text-xs">
                          {displayRemaining} Left
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Previous Requests & HR Response History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Previous Leave Applications & HR Responses
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">History of applications sent to HR Managers</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 w-full sm:w-auto overflow-x-auto">
              {['ALL', 'PENDING', 'APPROVED', 'REFUSED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    filterStatus === st
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-600">No leave requests match your criteria</p>
            <p className="text-xs text-gray-400">Click "Request Leave" above to submit a new time off application.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3.5 px-4">Leave Category</th>
                  <th className="py-3.5 px-4">Applied Dates</th>
                  <th className="py-3.5 px-4 text-center">Duration</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">HR Manager Status & Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map((r) => {
                  const typeName = r.timeOffType?.name || r.leaveType?.name || 'Leave';
                  const typeCode = r.timeOffType?.code || '';
                  const unitLabel = r.timeOffType?.unit === 'HOURS' ? 'hrs' : 'days';
                  const units = Number(r.requestedUnit ?? r.totalDays ?? 1);
                  const statusInfo = REQ_STATUS[r.status] || {
                    color: 'bg-gray-100 text-gray-700',
                    label: r.status,
                    icon: Clock,
                  };
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                            <Tag className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="font-bold text-gray-900">{typeName}</div>
                            {typeCode && <div className="text-[10px] text-gray-400 font-mono">{typeCode}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {r.startDate ? String(r.startDate).slice(0, 10) : ''} → {r.endDate ? String(r.endDate).slice(0, 10) : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                          {units} {unitLabel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 max-w-xs">
                        <p className="line-clamp-2 text-xs italic">{r.reason ? `"${r.reason}"` : '—'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border ${statusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </span>

                          {r.reviewNotes ? (
                            <div className="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-200/60 max-w-sm">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold text-gray-900">HR Feedback: </span>
                                {r.reviewNotes}
                                {r.reviewer?.name && (
                                  <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-emerald-500" /> Reviewed by {r.reviewer.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : r.status === 'PENDING' ? (
                            <div className="text-[11px] text-amber-700 font-medium italic">Awaiting review from HR Manager...</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {(r.status === 'PENDING' || r.status === 'DRAFT') && (
                          <button
                            onClick={() => handleCancelRequest(r.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Cancel
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
      </div>

      {/* Leave Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">New Leave Request</h3>
                <p className="text-xs text-gray-500 mt-0.5">Application will be sent directly to HR Manager for approval</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Leave Category *</label>
                <select
                  required
                  value={formData.timeOffTypeId}
                  onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Leave Type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) {t.isPaid ? '• Paid' : '• Unpaid'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Calculated Summary Badge */}
              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs text-blue-800">
                  <span className="font-medium">Calculated Duration:</span>
                  <span className="font-bold text-sm bg-blue-600 text-white px-2.5 py-0.5 rounded-lg">
                    {calculatedUnits} {selectedType?.unit === 'HOURS' ? 'Hours' : 'Days'}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Reason for Leave</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-none"
                  placeholder="Provide brief details for your HR Manager..."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Submitting to HR...' : 'Submit to HR Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
