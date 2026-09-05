import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Users,
    FileText,
    Clock,
    CalendarDays,
    Wallet,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
} from "lucide-react";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

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

const navItems = [
    {
        label: "Employees",
        path: "/",
        icon: Users,
        roles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"],
    },
    {
        label: "Contracts",
        path: "/contracts",
        icon: FileText,
        roles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"],
    },
    {
        label: "Attendance",
        path: "/attendance",
        icon: Clock,
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
        icon: CalendarDays,
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
        icon: Wallet,
        roles: ["ADMIN", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"],
    },
    {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
        roles: ["ADMIN", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"],
    },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Desktop collapse state, persisted across reloads.
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem("sidebar-collapsed") === "1";
        } catch {
            return false;
        }
    });
    // Mobile off-canvas state.
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
        } catch {
            // ignore storage errors (private browsing, etc.)
        }
    }, [collapsed]);

    // Close the mobile drawer whenever the route changes.
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const visibleNavItems = navItems.filter(
        (item) => user && item.roles.includes(user.role),
    );

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const initials = user?.employee
        ? `${user.employee.firstName[0]}${user.employee.lastName[0]}`
        : user?.email?.[0]?.toUpperCase() || "?";

    const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
        <>
            {/* Brand */}
            <div
                className={`flex items-center h-16 shrink-0 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}
            >
                <Link
                    to="/"
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-xl transition-transform duration-100 ease-out active:scale-[0.97] ${
                        collapsed ? "" : "min-w-0"
                    }`}
                >
                    {/* <div className="w-9 h-9 shrink-0 bg-blue-100/0 rounded-[11px] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_10px_rgba(37,99,235,0.25)]"> */}
                    {/* <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" /> */}
                    <img src="/logo-name.png" className="w-45" alt="" />
                    {/* </div> */}
                </Link>
                {/* Desktop collapse toggle */}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className={`hidden md:flex p-1.5 text-gray-400 rounded-full transition-all duration-150 ease-out hover:text-gray-700 hover:bg-black/[0.05] active:scale-90 ${
                        collapsed
                            ? "absolute right-[-15px] top-5 z-50 bg-white border border-black/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                            : ""
                    }`}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
                {/* Mobile close */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden p-1.5 text-gray-400 rounded-full transition-all duration-150 ease-out hover:text-gray-700 hover:bg-black/[0.05] active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Nav */}
            {/* Nav */}
            <nav
                className={`flex-1 min-h-0 px-2.5 py-4 space-y-1 ${
                    collapsed ? "overflow-hidden" : "overflow-y-auto"
                }`}
            >
                {visibleNavItems.map((item) => {
                    const active = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            title={collapsed ? item.label : undefined}
                            className={`group relative flex items-center gap-3 rounded-[12px] text-[13.5px] font-medium tracking-[-0.005em] transition-all duration-150 ease-out active:scale-[0.97] ${
                                collapsed
                                    ? "justify-center px-0 py-2.5"
                                    : "px-3 py-2.5"
                            } ${
                                active
                                    ? "bg-blue-600/10 text-blue-600"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-black/[0.04]"
                            }`}
                        >
                            <Icon
                                className="w-[18px] h-[18px] shrink-0"
                                strokeWidth={2}
                            />

                            {!collapsed && (
                                <span className="truncate">{item.label}</span>
                            )}

                            {collapsed && (
                                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div
                className={`shrink-0 border-t border-black/[0.06] p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}
            >
                <div
                    className={`flex items-center gap-2.5 rounded-[12px] p-1.5 ${collapsed ? "flex-col" : ""}`}
                >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[13px] font-semibold">
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-gray-900 truncate leading-tight">
                                {user?.employee
                                    ? `${user.employee.firstName} ${user.employee.lastName}`
                                    : user?.email}
                            </p>
                            <span
                                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.01em] ${
                                    roleColors[user?.role || ""] ||
                                    "bg-gray-500/10 text-gray-600"
                                }`}
                            >
                                {roleLabels[user?.role || ""] || user?.role}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className={`flex items-center gap-2.5 rounded-[12px] text-[13px] font-medium text-gray-500 transition-all duration-150 ease-out hover:text-red-600 hover:bg-red-500/10 active:scale-[0.97] ${
                        collapsed
                            ? "justify-center w-9 h-9"
                            : "w-full px-3 py-2 mt-1"
                    }`}
                >
                    <FiLogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Log out</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile top bar */}
            <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -ml-2 text-gray-500 rounded-full transition-all duration-150 ease-out hover:bg-black/[0.05] active:scale-90"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="w-7 h-7 bg-blue-600 rounded-[9px] flex items-center justify-center">
                    <HiOutlineBuildingOffice2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-[15px] font-semibold text-gray-900 tracking-[-0.01em]">
                    PeoplePay360
                </span>
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ease-out"
                    onClick={() => setMobileOpen(false)}
                >
                    <aside
                        onClick={(e) => e.stopPropagation()}
                        className="h-full w-72 max-w-[80vw] flex flex-col bg-white/95 backdrop-blur-xl border-r border-black/[0.06] shadow-[0_0_40px_rgba(0,0,0,0.15)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]"
                    >
                        <SidebarContent
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </aside>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex md:flex-col shrink-0 relative min-w-0 bg-white/80 backdrop-blur-xl border-r border-black/[0.06] h-screen sticky top-0 transition-[width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] ${
                    collapsed ? "w-[76px]" : "w-64"
                }`}
                style={{ WebkitBackdropFilter: "blur(20px) saturate(180%)" }}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
