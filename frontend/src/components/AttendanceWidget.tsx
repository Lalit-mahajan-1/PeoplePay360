import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Clock, LogIn, LogOut, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  overtimeMinutes: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
  isManualEdit: boolean;
  correctedById: string | null;
  correctedAt: string | null;
  notes: string | null;
}

export interface TodayResponse {
  exists: boolean;
  record: AttendanceRecord | null;
  schedule: {
    weekday: string;
    isWorkingDay: boolean;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
    expectedMinutes?: number;
  };
}

interface AttendanceWidgetProps {
  onStatusChange?: () => void;
}

function formatDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes / 15) * 15);
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (!rounded) return '0 hrs';
  if (!remainder) return `${hours} hrs`;
  if (remainder === 30) return `${hours}.5 hrs`;
  return `${hours} hrs ${remainder} mins`;
}

export default function AttendanceWidget({ onStatusChange }: AttendanceWidgetProps) {
  const [todayData, setTodayData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayData = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<{ success: boolean; data: TodayResponse }>('/attendance/today');
      setTodayData(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load today\'s attendance status';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('Checked in successfully!');
      await fetchTodayData();
      onStatusChange?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      await fetchTodayData();
      onStatusChange?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getElapsedTime = (checkInStr: string) => {
    const start = new Date(checkInStr).getTime();
    const now = currentTime.getTime();
    const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded w-1/2" />
        <div className="h-12 bg-gray-200 rounded w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchTodayData();
          }}
          className="px-4 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const record = todayData?.record;
  const isCheckedIn = !!record?.checkIn && !record?.checkOut;
  const isCheckedOut = !!record?.checkIn && !!record?.checkOut;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Today's Attendance</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Live Digital Clock */}
        <div className="text-right">
          <span className="font-mono text-lg font-bold text-gray-900 tracking-tight">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Live Time</p>
        </div>
      </div>

      <>
          {/* Status Details */}
          {!record ? (
            /* Not checked in yet */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                    Current Status
                  </span>
                  <span className="text-sm font-bold text-amber-900">Not Checked In</span>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                  Pending
                </span>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                {actionLoading ? 'Checking in...' : 'Check In Now'}
              </button>
            </div>
          ) : isCheckedIn ? (
            /* Checked in, active working session */
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Current Status
                    </span>
                    <span className="text-sm font-bold text-emerald-900">Checked In</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full animate-pulse">
                    Working
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 text-xs">
                  <div>
                    <span className="text-emerald-700 block">Check In Time</span>
                    <span className="font-bold text-emerald-950 text-sm">
                      {formatTime(record.checkIn)}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">Active Timer</span>
                    <span className="font-mono font-bold text-emerald-950 text-sm">
                      {getElapsedTime(record.checkIn!)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-rose-500/20 transition disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                {actionLoading ? 'Checking out...' : 'Check Out Now'}
              </button>
            </div>
          ) : isCheckedOut ? (
            /* Checked out for today */
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Completed for Today</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 text-xs text-blue-900">
                <div>
                  <span className="text-blue-600 block text-[11px]">Check In</span>
                  <span className="font-bold">{formatTime(record.checkIn)}</span>
                </div>
                <div>
                  <span className="text-blue-600 block text-[11px]">Check Out</span>
                  <span className="font-bold">{formatTime(record.checkOut)}</span>
                </div>
                <div>
                  <span className="text-blue-600 block text-[11px]">Total Worked</span>
                  <span className="font-bold">{formatDuration(record.workedMinutes)}</span>
                </div>
              </div>
            </div>
          ) : null}
      </>
    </div>
  );
}
