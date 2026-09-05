import React, { useEffect, useState } from 'react';
import { getMyProfile, getMyLeaveBalances, getMyPayslips } from '../api/employeeApi';
import type { EmployeeProfile, LeaveBalance, Payslip } from '../types/employee.types';
import ProfileCard from '../components/ProfileCard';
import AttendanceWidget from '../components/AttendanceWidget';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import RecentPayslips from '../components/RecentPayslips';

const EmployeeDashboard: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [profileRes, leaveRes, payslipRes] = await Promise.allSettled([
          getMyProfile(),
          getMyLeaveBalances(),
          getMyPayslips(),
        ]);

        let hasError = false;

        if (profileRes.status === 'fulfilled') {
          const resData = profileRes.value.data as any;
          setProfile(resData?.data ?? resData ?? null);
        } else {
          hasError = true;
        }

        if (leaveRes.status === 'fulfilled') {
          const resData = leaveRes.value.data as any;
          const list = resData?.data ?? resData;
          setLeaveBalances(Array.isArray(list) ? list : []);
        }

        if (payslipRes.status === 'fulfilled') {
          const resData = payslipRes.value.data as any;
          const list = resData?.data ?? resData;
          setPayslips(Array.isArray(list) ? list : []);
        }

        if (hasError && profileRes.status === 'rejected' && leaveRes.status === 'rejected' && payslipRes.status === 'rejected') {
          setError('Failed to load dashboard data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome back, {profile?.firstName || 'Employee'}! 👋
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Profile */}
        <div className="lg:col-span-1">
          {profile ? (
            <ProfileCard profile={profile} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 text-gray-500">
              <p>Profile info unavailable.</p>
            </div>
          )}
        </div>

        {/* Right Column — Widgets */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceWidget />
          <LeaveBalanceCard balances={leaveBalances} />
          <RecentPayslips payslips={payslips} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;