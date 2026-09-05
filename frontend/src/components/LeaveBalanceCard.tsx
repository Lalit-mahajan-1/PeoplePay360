import React from 'react';
import type { LeaveBalance } from '../types/employee.types';

interface Props {
  balances: LeaveBalance[];
}

const LeaveBalanceCard: React.FC<Props> = ({ balances }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🏖️ Leave Balances</h3>

      {balances.length === 0 ? (
        <p className="text-sm text-gray-400">No leave data available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {balances.map((b) => {
            const totalDays = b.totalDays || 0;
            const usedDays = b.usedDays || 0;
            const pendingDays = b.pendingDays || 0;
            const remaining = totalDays - usedDays - pendingDays;
            const percentage = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

            return (
              <div key={b.id || Math.random().toString()} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {b.leaveType?.name || 'Leave'}
                  </span>
                  <span className="text-xs text-gray-400">{b.year || ''}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${
                      percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Used: {usedDays}</span>
                  <span>Pending: {pendingDays}</span>
                  <span className="font-bold text-gray-700">
                    Left: {remaining}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveBalanceCard;