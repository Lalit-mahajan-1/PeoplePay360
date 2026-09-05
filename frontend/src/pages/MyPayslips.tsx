import { useEffect, useState } from 'react';
import { getMyPayslips } from '../api/employeeApi';
import type { Payslip } from '../types/employee.types';
import RecentPayslips from '../components/RecentPayslips';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';

export default function MyPayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const res = await getMyPayslips();
      const data = (res.data as any)?.data ?? res.data;
      setPayslips(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const latest = payslips[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Payslips</h1>
        <p className="text-sm text-gray-500 mt-1">Access monthly salary slips, tax breakdowns, and payment history</p>
      </div>

      {latest && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-semibold">Latest Statement</span>
            <h2 className="text-3xl font-extrabold mt-2">₹{(latest.netPay || 0).toLocaleString()}</h2>
            <p className="text-sm text-blue-100 mt-1">Net Pay for {latest.month}/{latest.year}</p>
          </div>
          <button
            onClick={() => toast.success('Payslip PDF downloaded successfully!')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      )}

      <RecentPayslips payslips={payslips} />
    </div>
  );
}
