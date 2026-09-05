import AttendanceWidget from '../components/AttendanceWidget';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function MyAttendance() {
  const dummyHistory = [
    { id: '1', date: '2026-09-04', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0 hrs', status: 'PRESENT' },
    { id: '2', date: '2026-09-03', checkIn: '09:15 AM', checkOut: '06:00 PM', hours: '8.75 hrs', status: 'PRESENT' },
    { id: '3', date: '2026-09-02', checkIn: '09:45 AM', checkOut: '06:15 PM', hours: '8.5 hrs', status: 'LATE' },
    { id: '4', date: '2026-09-01', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0 hrs', status: 'PRESENT' },
    { id: '5', date: '2026-08-31', checkIn: '—', checkOut: '—', hours: '0 hrs', status: 'ABSENT' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Track daily check-ins, working hours, and attendance logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AttendanceWidget />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Days Present</p>
                <p className="text-lg font-bold text-gray-800">18 Days</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Late Arrival</p>
                <p className="text-lg font-bold text-gray-800">1 Day</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Absences</p>
                <p className="text-lg font-bold text-gray-800">1 Day</p>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Attendance Log (September 2026)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Check In</th>
                    <th className="pb-3 font-medium">Check Out</th>
                    <th className="pb-3 font-medium">Total Worked</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dummyHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-medium text-gray-800">{item.date}</td>
                      <td className="py-3 text-gray-600">{item.checkIn}</td>
                      <td className="py-3 text-gray-600">{item.checkOut}</td>
                      <td className="py-3 font-medium text-gray-700">{item.hours}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'PRESENT'
                              ? 'bg-green-100 text-green-700'
                              : item.status === 'LATE'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
