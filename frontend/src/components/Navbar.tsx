import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  HR_MANAGER: 'bg-purple-100 text-purple-700',
  HR_PAYROLL_USER: 'bg-blue-100 text-blue-700',
  HR_PAYROLL_MANAGER: 'bg-indigo-100 text-indigo-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'Payroll User',
  HR_PAYROLL_MANAGER: 'Payroll Mgr',
  EMPLOYEE: 'Employee',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Employees', path: '/', roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'] },
    { label: 'Contracts', path: '/contracts', roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'] },
    { label: 'Attendance', path: '/attendance', roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE'] },
    { label: 'Time Off', path: '/time-off', roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE'] },
    { label: 'Payroll', path: '/payroll', roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'] },
    { label: 'Reports', path: '/reports', roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-lg">💼</span>
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">
              PeoplePay360
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                roleColors[user?.role || ''] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {roleLabels[user?.role || ''] || user?.role}
            </span>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.employee
                  ? `${user.employee.firstName} ${user.employee.lastName}`
                  : user?.email}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}