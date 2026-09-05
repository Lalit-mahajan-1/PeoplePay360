import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const roleColors: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-600",
    HR_MANAGER: "bg-purple-500/10 text-purple-600",
    HR_PAYROLL_USER: "bg-blue-500/10 text-blue-600",
    HR_PAYROLL_MANAGER: "bg-indigo-500/10 text-indigo-600",
    EMPLOYEE: "bg-emerald-500/10 text-emerald-600",
};

const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    HR_MANAGER: "HR Manager",
    HR_PAYROLL_USER: "Payroll User",
    HR_PAYROLL_MANAGER: "Payroll Mgr",
    EMPLOYEE: "Employee",
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        {
            label: "Employees",
            path: "/",
            roles: [
                "ADMIN",
                "HR_MANAGER",
                "HR_PAYROLL_USER",
                "HR_PAYROLL_MANAGER",
            ],
        },
        {
            label: "Contracts",
            path: "/contracts",
            roles: [
                "ADMIN",
                "HR_MANAGER",
                "HR_PAYROLL_USER",
                "HR_PAYROLL_MANAGER",
            ],
        },
        {
            label: "Attendance",
            path: "/attendance",
            roles: [
                "ADMIN",
                "HR_MANAGER",
                "HR_PAYROLL_USER",
                "HR_PAYROLL_MANAGER",
                "EMPLOYEE",
            ],
        },
        {
            label: "Time Off",
            path: "/time-off",
            roles: [
                "ADMIN",
                "HR_MANAGER",
                "HR_PAYROLL_USER",
                "HR_PAYROLL_MANAGER",
                "EMPLOYEE",
            ],
        },
        {
            label: "Payroll",
            path: "/payroll",
            roles: ["ADMIN", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"],
        },
        {
            label: "Reports",
            path: "/reports",
            roles: ["ADMIN", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"],
        },
    ];

    const visibleNavItems = navItems.filter(
        (item) => user && item.roles.includes(user.role),
    );

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    return (
        <header
            className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl backdrop-saturate-150 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]"
            style={{ WebkitBackdropFilter: "blur(20px) saturate(180%)" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition-transform duration-100 ease-out active:scale-[0.97]"
                    >
                        <div className="w-9 h-9 bg-blue-600 rounded-[11px] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_10px_rgba(37,99,235,0.25)]">
                            <span className="text-lg leading-none">💼</span>
                        </div>
                        <span className="text-[17px] font-semibold text-gray-900 tracking-[-0.01em] hidden sm:block">
                            PeoplePay360
                        </span>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {visibleNavItems.map((item) => {
                            const active = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative px-3.5 py-1.5 rounded-full text-[13px] font-medium tracking-[-0.005em] transition-all duration-150 ease-out active:scale-[0.96] ${
                                        active
                                            ? "bg-blue-600/10 text-blue-600"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-black/[0.04]"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.01em] ${
                                roleColors[user?.role || ""] ||
                                "bg-gray-500/10 text-gray-600"
                            }`}
                        >
                            {roleLabels[user?.role || ""] || user?.role}
                        </span>
                        <div className="hidden sm:block text-right">
                            <p className="text-[13px] font-medium text-gray-900 leading-tight">
                                {user?.employee
                                    ? `${user.employee.firstName} ${user.employee.lastName}`
                                    : user?.email}
                            </p>
                            <p className="text-[11px] text-gray-500 leading-tight">
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 rounded-full transition-all duration-150 ease-out hover:text-red-600 hover:bg-red-500/10 active:scale-90"
                            title="Logout"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
