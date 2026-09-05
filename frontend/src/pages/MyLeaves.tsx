import { useEffect, useState } from 'react';
import { getMyLeaveBalances, getMyLeaveRequests, submitLeaveRequest } from '../api/employeeApi';
import type { LeaveBalance, LeaveRequest } from '../types/employee.types';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import toast from 'react-hot-toast';
import { Plus, Clock } from 'lucide-react';

export default function MyLeaves() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balRes, reqRes] = await Promise.allSettled([
        getMyLeaveBalances(),
        getMyLeaveRequests(),
      ]);

      if (balRes.status === 'fulfilled') {
        const data = (balRes.value.data as any)?.data ?? balRes.value.data;
        setBalances(Array.isArray(data) ? data : []);
      }
      if (reqRes.status === 'fulfilled') {
        const data = (reqRes.value.data as any)?.data ?? reqRes.value.data;
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    try {
      await submitLeaveRequest(formData);
      toast.success('Leave request submitted successfully');
      setShowModal(false);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch {
      toast.error('Failed to submit leave request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Time Off & Leaves</h1>
          <p className="text-sm text-gray-500 mt-1">View leave balances and request time off</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      <div className="space-y-6">
        <LeaveBalanceCard balances={balances} />

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            My Leave Requests
          </h3>

          {requests.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No leave requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="pb-3 font-medium">Leave Type</th>
                    <th className="pb-3 font-medium">Dates</th>
                    <th className="pb-3 font-medium">Total Days</th>
                    <th className="pb-3 font-medium">Reason</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-medium text-gray-800">{r.leaveType?.name || 'Leave'}</td>
                      <td className="py-3 text-gray-600">{r.startDate} to {r.endDate}</td>
                      <td className="py-3 font-semibold text-gray-700">{r.totalDays} Days</td>
                      <td className="py-3 text-gray-500 max-w-xs truncate">{r.reason || '—'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            r.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : r.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900">New Leave Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Reason for leave request..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border text-gray-600 rounded-xl text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
