import React from 'react';
import type { Payslip } from '../types/employee.types';

interface Props {
  payslips: Payslip[];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  GENERATED: 'bg-yellow-100 text-yellow-700',
};

const RecentPayslips: React.FC<Props> = ({ payslips }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Recent Payslips</h3>

      {payslips.length === 0 ? (
        <p className="text-sm text-gray-400">No payslips available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Period</th>
                <th className="pb-3 font-medium">Gross</th>
                <th className="pb-3 font-medium">Deductions</th>
                <th className="pb-3 font-medium">Net Pay</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(payslips || []).slice(0, 5).map((p) => (
                <tr key={p.id || Math.random().toString()} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-800">
                    {MONTH_NAMES[(p.month || 1) - 1] || 'Jan'} {p.year || ''}
                  </td>
                  <td className="py-3 text-gray-600">
                    ₹{(p.grossPay || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-red-500">
                    -₹{(p.deductions || 0).toLocaleString()}
                  </td>
                  <td className="py-3 font-bold text-gray-800">
                    ₹{(p.netPay || 0).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[p.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.status || 'UNKNOWN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentPayslips;