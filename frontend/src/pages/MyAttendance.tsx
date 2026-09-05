import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import AttendanceWidget, { type AttendanceRecord } from '../components/AttendanceWidget';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
  CalendarRange,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

interface AttendanceSummary {
  month: string;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  halfDays: number;
  onLeaveDays: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  averageWorkedHours: number;
}

interface HistoryResponse {
  data: AttendanceRecord[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
}

export default function MyAttendance() {
  const getCurrentMonthStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  // Generate recent 12 months for dropdown selector
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  const fetchSummary = useCallback(async (monthStr: string) => {
    setLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await api.get<{ success: boolean; data: AttendanceSummary }>(
        `/attendance/my-summary?month=${monthStr}`
      );
      setSummary(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load summary';
      setErrorSummary(msg);
      toast.error(msg);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchHistory = useCallback(async (monthStr: string) => {
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const res = await api.get<HistoryResponse>(
        `/attendance/my-history?month=${monthStr}&limit=31`
      );
      setHistory(res.data.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load attendance logs';
      setErrorHistory(msg);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadData = useCallback(() => {
    fetchSummary(selectedMonth);
    fetchHistory(selectedMonth);
  }, [selectedMonth, fetchSummary, fetchHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatWorkedHours = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0.0 hrs';
    return `${(minutes / 60).toFixed(1)} hrs`;
  };

  const formatTimeStr = (isoStr: string | null) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            PRESENT
          </span>
        );
      case 'LATE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
            LATE
          </span>
        );
      case 'ABSENT':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
            ABSENT
          </span>
        );
      case 'HALF_DAY':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200/80">
            HALF DAY
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
            ON LEAVE
          </span>
        );
      case 'HOLIDAY':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200/80">
            HOLIDAY
          </span>
        );
      case 'WEEKEND':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            WEEKEND
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your daily check-ins, working hours, and monthly attendance logs
          </p>
        </div>

        {/* Month Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 transition">
            <CalendarRange className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-800 outline-none pr-6 cursor-pointer appearance-none"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid: Widget Left + Summary Cards & History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Check-in/out Widget */}
        <div className="lg:col-span-1">
          <AttendanceWidget onStatusChange={loadData} />
        </div>

        {/* Right Column: Summary Cards & History Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Monthly Overview ({selectedMonth})
              </h3>
              <button
                onClick={loadData}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {loadingSummary ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : errorSummary ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center text-xs text-red-600">
                {errorSummary}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Present Days */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Present
                    </span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.presentDays ?? 0} <span className="text-xs text-gray-400 font-normal">days</span>
                  </p>
                </div>

                {/* Late Arrivals */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-amber-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Late
                    </span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.lateDays ?? 0} <span className="text-xs text-gray-400 font-normal">days</span>
                  </p>
                </div>

                {/* Absences */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-rose-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Absent
                    </span>
                    <XCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.absentDays ?? 0} <span className="text-xs text-gray-400 font-normal">days</span>
                  </p>
                </div>

                {/* Half Days */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-orange-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Half Day
                    </span>
                    <Clock3 className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.halfDays ?? 0} <span className="text-xs text-gray-400 font-normal">days</span>
                  </p>
                </div>

                {/* Worked Hours */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-blue-600">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Total Worked
                    </span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.totalWorkedHours ?? 0} <span className="text-xs text-gray-400 font-normal">hrs</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* History Table Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Attendance Logs
              </h3>
              <span className="text-xs font-semibold text-gray-500">
                {history.length} {history.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : errorHistory ? (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center text-xs text-rose-600">
                {errorHistory}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-600">No attendance logs found</p>
                <p className="text-xs text-gray-400">
                  There are no attendance records logged for {selectedMonth}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-3 px-2 font-bold">Date</th>
                      <th className="pb-3 px-2 font-bold">Check In</th>
                      <th className="pb-3 px-2 font-bold">Check Out</th>
                      <th className="pb-3 px-2 font-bold">Total Worked</th>
                      <th className="pb-3 px-2 font-bold">Overtime</th>
                      <th className="pb-3 px-2 font-bold">Status</th>
                      <th className="pb-3 px-2 font-bold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/60 transition">
                        <td className="py-3.5 px-2 font-bold text-gray-900 whitespace-nowrap">
                          {formatDateStr(record.workDate)}
                        </td>
                        <td className="py-3.5 px-2 text-gray-600 whitespace-nowrap">
                          {formatTimeStr(record.checkIn)}
                        </td>
                        <td className="py-3.5 px-2 text-gray-600 whitespace-nowrap">
                          {formatTimeStr(record.checkOut)}
                        </td>
                        <td className="py-3.5 px-2 font-semibold text-gray-800 whitespace-nowrap">
                          {formatWorkedHours(record.workedMinutes)}
                        </td>
                        <td className="py-3.5 px-2 text-gray-600 whitespace-nowrap">
                          {record.overtimeMinutes > 0
                            ? formatWorkedHours(record.overtimeMinutes)
                            : '—'}
                        </td>
                        <td className="py-3.5 px-2 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(record.status)}
                            {record.isManualEdit && (
                              <span
                                className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                                title="Manually edited by HR"
                              >
                                ✏️ Edited
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-xs text-gray-500 max-w-xs truncate">
                          {record.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
