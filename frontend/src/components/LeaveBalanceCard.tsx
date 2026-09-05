import React from 'react';
import type { LeaveBalance } from '../types/employee.types';

interface Props {
  balances: LeaveBalance[];
}

const LeaveBalanceCard: React.FC<Props> = ({ balances }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">🏖️</span> Leave Balances
      </h3>

      {balances.length === 0 ? (
        <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 font-medium">No leave balances allocated yet.</p>
          <p className="text-xs text-gray-400 mt-1">Allocations are granted by HR Managers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((b) => {
            const name = b.timeOffType?.name || b.leaveType?.name || 'Leave';
            const code = b.timeOffType?.code || b.leaveType?.code || '';
            const unit = b.timeOffType?.unit || 'DAYS';
            const total = Number(b.allocated ?? b.totalDays ?? 0);
            const used = Number(b.taken ?? b.consumed ?? b.usedDays ?? 0);
            const pending = Number(b.pending ?? b.pendingDays ?? 0);
            const remaining = Number(b.remaining ?? (total - used - pending));
            const percentage = total > 0 ? (used / total) * 100 : 0;

            return (
              <div key={b.id || Math.random().toString()} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-800">{name}</span>
                    {code && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {code}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {b.validTo ? `Till ${b.validTo.slice(0, 10)}` : 'Annual'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Used: <strong className="text-gray-700">{used}</strong></span>
                  <span>Pending: <strong className="text-amber-600">{pending}</strong></span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    Remaining: {remaining} {unit === 'HOURS' ? 'hrs' : 'days'}
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