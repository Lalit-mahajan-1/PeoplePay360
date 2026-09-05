import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  User,
  Lock,
  Bell,
  Monitor,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldAlert,
  Loader2,
  Mail,
  Smartphone,
  MapPin,
  Calendar
} from 'lucide-react';
import api from '../services/api';

type TabType = 'profile' | 'security' | 'notifications' | 'sessions';

export default function AccountSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile Form States (Self-Service fields)
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Notification States
  const [notifyPayroll, setNotifyPayroll] = useState(true);
  const [notifyLeave, setNotifyLeave] = useState(true);
  const [notifyAttendance, setNotifyAttendance] = useState(false);

  // Password Validation Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const passwordStrength = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length;

  useEffect(() => {
    const emp = user?.employee as any;
    if (emp) {
      setPhone(emp.phone || '');
      setAddress(emp.address || '');
      setCity(emp.city || '');
      setState(emp.state || '');
      setPostalCode(emp.postalCode || '');
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordStrength < 4) {
      toast.error('Please choose a stronger password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      // In production: await api.put('/auth/change-password', { currentPassword, newPassword });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API Call
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password update failed');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      await api.put('/employees/me', {
        phone,
        address,
        city,
        state,
        postalCode
      });
      toast.success('Contact information updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update contact info');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage security credentials, self-service contact details, and notification preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
          {[
            { id: 'profile', label: 'My Workspace Profile', icon: User },
            { id: 'security', label: 'Password & Security', icon: Lock },
            { id: 'notifications', label: 'Notification Preferences', icon: Bell },
            { id: 'sessions', label: 'Active Sessions', icon: Monitor },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 shadow-xxs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <div className="divide-y divide-slate-100">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">My Workspace Profile</h2>
                <p className="text-xs text-slate-500">Review non-editable corporate metadata and update your contact records.</p>
              </div>

              {/* Corporate Metadata Panel */}
              <div className="p-6 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Corporate Records</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Work Email</span>
                      <span className="font-semibold text-slate-800">{user?.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Assigned Role</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mt-0.5">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  {user?.employee && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Job Title & Code</span>
                          <span className="font-semibold text-slate-800">{(user.employee as any)?.jobPosition || 'Employee'} ({user.employee.employeeCode})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Department</span>
                          <span className="font-semibold text-slate-800">{user.employee.department?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Self-Service Update Contact Form */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Information (Self-Service)</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Postal Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                        placeholder="House / Office location details"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                        placeholder="Bangalore"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                          placeholder="Karnataka"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Postal Code</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                          placeholder="560001"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Profile Updates
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div className="divide-y divide-slate-100">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Password & Security</h2>
                <p className="text-xs text-slate-500">Ensure your administrative payroll workstation uses a strong, resilient password.</p>
              </div>

              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Workstation Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-3 space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Security Index Rating</span>
                          <span className={
                            passwordStrength <= 2 ? 'text-red-500' :
                              passwordStrength <= 4 ? 'text-yellow-500' : 'text-emerald-500'
                          }>
                            {passwordStrength <= 2 ? 'Weak password index' :
                              passwordStrength <= 4 ? 'Moderate standard' : 'Strong & compliant'}
                          </span>
                        </div>
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength
                                  ? passwordStrength <= 2 ? 'bg-red-500' :
                                    passwordStrength <= 4 ? 'bg-yellow-500' : 'bg-emerald-500'
                                  : 'bg-slate-200'
                                }`}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            8+ Chars
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            Uppercase letter
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            Lowercase letter
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            Numeric value
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                            Special character (!@#$ etc)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || passwordStrength < 4}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                      Commit Change Credentials
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="divide-y divide-slate-100">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Notification Preferences</h2>
                <p className="text-xs text-slate-500">Determine exactly what email and workflow triggers publish messages to you.</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Switch Item 1 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-900 block">Payroll Processed Alerts</span>
                    <span className="text-xs text-slate-500 block max-w-md">Get instant confirmation whenever a new period payrun is calculated and locked by administrators.</span>
                  </div>
                  <button
                    onClick={() => setNotifyPayroll(!notifyPayroll)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifyPayroll ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${notifyPayroll ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 2 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-900 block">Time Off Approval Updates</span>
                    <span className="text-xs text-slate-500 block max-w-md">Receive email notifications when leave allocations or structural requests are checked, reviewed, and finalized.</span>
                  </div>
                  <button
                    onClick={() => setNotifyLeave(!notifyLeave)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifyLeave ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${notifyLeave ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 3 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-900 block">Attendance Exceptions Warns</span>
                    <span className="text-xs text-slate-500 block max-w-md">Notify me immediately of missing check-outs, anomalies, or late records identified within work shifts.</span>
                  </div>
                  <button
                    onClick={() => setNotifyAttendance(!notifyAttendance)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifyAttendance ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${notifyAttendance ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="divide-y divide-slate-100">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Active Sessions</h2>
                <p className="text-xs text-slate-500">Track and monitor your currently authenticated browser workstations accessing this workspace.</p>
              </div>

              <div className="p-6 space-y-4">
                {[
                  { device: 'Vite Developer Workstation (Windows 11)', browser: 'Chrome Desktop 124.0', location: 'Bangalore, Karnataka, India', current: true, date: 'Right Now' },
                  { device: 'Safari Mobile Device (iPhone 15 Pro)', browser: 'iOS WebKit Client', location: 'Mumbai, Maharashtra, India', current: false, date: '2 days ago' },
                ].map((session, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate block">{session.device}</span>
                        {session.current && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          {session.location}
                        </span>
                        <span>•</span>
                        <span>{session.browser}</span>
                        <span>•</span>
                        <span>{session.date}</span>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 cursor-pointer">
                        Revoke Access
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}