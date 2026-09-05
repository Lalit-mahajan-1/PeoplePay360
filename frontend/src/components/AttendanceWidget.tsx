import React, { useState } from 'react';
import { checkIn, checkOut } from '../api/employeeApi';

const AttendanceWidget: React.FC = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await checkIn();
      setIsCheckedIn(true);
    } catch {
      alert('Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await checkOut();
      setIsCheckedIn(false);
    } catch {
      alert('Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Today's Attendance</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Current Status</p>
          <p className={`text-lg font-bold ${isCheckedIn ? 'text-green-600' : 'text-orange-500'}`}>
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <button
          onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
            isCheckedIn
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          } disabled:opacity-50`}
        >
          {loading ? '...' : isCheckedIn ? 'Check Out' : 'Check In'}
        </button>
      </div>
    </div>
  );
};

export default AttendanceWidget;