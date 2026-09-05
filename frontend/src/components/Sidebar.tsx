import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    LayoutDashboard,
    User,
    Clock,
    CalendarDays,
    Wallet,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Users,
    FileText,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
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

interface NavSection {
    title: string;
    items: {
        label: string;
        path: string;
        icon: any;
        roles?: string[];
    }[];
}

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem("sidebar-collapsed") === "1";
        } catch {
            return false;
        }
    });

    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
        } catch {}
    }, [collapsed]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const initials = user?.employee
        ? `${user.employee.firstName?.[0] || ""}${user.employee.lastName?.[0] || ""}`
        : user?.email?.[0]?.toUpperCase() || "?";

    const navSections: NavSection[] = [
        {
            title: "OVERVIEW",
            items: [
                {
                    label: "Dashboard",
                    path: "/",
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            title: "SELF-SERVICE (MY WORKSPACE)",
            items: [
                {
                    label: "My Profile",
                    path: "/profile",
                    icon: User,
                },
                {
                    label: "Attendance",
                    path: "/attendance",
                    icon: Clock,
                },
                {
                    label: "Time Off / Leaves",
                    path: "/time-off",
                    icon: CalendarDays,
                },
                {
                    label: "My Payslips",
                    path: "/payslips",
                    icon: Wallet,
                },
            ],
        },
        {
            title: "COMPANY (READ-ONLY)",
            items: [
                {
                    label: "Team Directory",
                    path: "/directory",
                    icon: Building2,
                },
            ],
        },
    ];

    // Add HR & Admin management options if user has elevated role
    const isAdminOrHR =
        user &&
        [
            "ADMIN",
            "HR_MANAGER",
            "HR_PAYROLL_USER",
            "HR_PAYROLL_MANAGER",
        ].includes(user.role);
    if (isAdminOrHR) {
        navSections.push({
            title: "ADMINISTRATION",
            items: [
                {
                    label: "Employees",
                    path: "/admin/employees",
                    icon: Users,
                    roles: [
                        "ADMIN",
                        "HR_MANAGER",
                        "HR_PAYROLL_USER",
                        "HR_PAYROLL_MANAGER",
                    ],
                },
                {
                    label: "User Management",
                    path: "/users",
                    icon: ShieldCheck,
                    roles: ["ADMIN"],
                },
                {
                    label: "Contracts",
                    path: "/contracts",
                    icon: FileText,
                    roles: [
                        "ADMIN",
                        "HR_MANAGER",
                        "HR_PAYROLL_USER",
                        "HR_PAYROLL_MANAGER",
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
            ],
        });
    }

    navSections.push({
        title: "ACCOUNT",
        items: [
            {
                label: "Account Settings",
                path: "/settings",
                icon: Settings,
            },
        ],
    });

    const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
        <>
            {/* Brand */}
            <div
                className={`flex items-center bg-[#f9f5f2] h-16 shrink-0 ${
                    collapsed ? "justify-center px-0" : "justify-between px-4"
                }`}
            >
                <Link
                    to="/"
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-xl transition-transform duration-100 ease-out active:scale-[0.97] ${
                        collapsed ? "" : "min-w-0"
                    }`}
                >
                    {collapsed ? (
                        <img src="/logo.png" className="w-10" alt="" />
                    ) : (
                        <img src="/logo-name.png" className="w-45" alt="" />
                    )}
                    {/* <img src="/logo.png" className="w-10" alt="" /> */}
                </Link>

                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className={`hidden md:flex p-1.5 text-gray-400 rounded-full transition-all duration-150 ease-out cursor-pointer hover:text-gray-700 cursor-pointer hover:bg-black/[0.05] active:scale-90 ${
                        collapsed
                            ? "absolute right-[-15px] top-5 z-50 bg-white border border-black/[0.08] shadow-sm"
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

                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden p-1.5 text-gray-400 rounded-full transition-all duration-150 ease-out cursor-pointer hover:text-gray-700 cursor-pointer hover:bg-black/[0.05] active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Nav with Section Headers */}
            <nav
                className={`flex-1 min-h-0 px-2.5 py-3 space-y-4 ${
                    collapsed ? "overflow-hidden" : "overflow-y-auto"
                }`}
            >
                {navSections.map((section, sIdx) => {
                    const filteredItems = section.items.filter(
                        (item) =>
                            !item.roles ||
                            (user && item.roles.includes(user.role)),
                    );

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={sIdx} className="space-y-1">
                            {!collapsed && (
                                <h4 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                    {section.title}
                                </h4>
                            )}
                            {filteredItems.map((item) => {
                                const active = location.pathname === item.path;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onNavigate}
                                        title={
                                            collapsed ? item.label : undefined
                                        }
                                        className={`group relative flex items-center gap-3 rounded-[12px] text-[13.5px] font-medium tracking-[-0.005em] transition-all duration-150 active:scale-[0.97] ${
                                            collapsed
                                                ? "justify-center px-0 py-2.5"
                                                : "px-3 py-2.5"
                                        } ${
                                            active
                                                ? "bg-blue-600/10 text-blue-600 font-semibold"
                                                : "text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-black/[0.04]"
                                        }`}
                                    >
                                        <Icon
                                            className="w-[18px] h-[18px] shrink-0"
                                            strokeWidth={2}
                                        />

                                        {!collapsed && (
                                            <span className="truncate">
                                                {item.label}
                                            </span>
                                        )}

                                        {collapsed && (
                                            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Footer / User Profile & Logout */}
            <div
                className={`shrink-0 border-t border-amber-600/40 bg-[#f9f5f2] p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}
            >
                <Link
                    to={"/profile"}
                    onClick={onNavigate}
                    className={`flex items-center cursor-pointer hover:bg-blue-100/30 gap-2.5 rounded-[12px] p-1.5 ${collapsed ? "flex-col" : ""}`}
                >
                    <div
                        className={`group relative shrink-0 overflow-hidden rounded-full border border-white bg-indigo-100 text-indigo-700 shadow-sm ${
                            collapsed ? "h-9 w-9" : "h-9 w-9"
                        }`}
                    >
                        {user?.employee?.avatarUrl ? (
                            <img
                                src={user.employee.avatarUrl}
                                alt={
                                    user.employee
                                        ? `${user.employee.firstName || ""} ${
                                              user.employee.lastName || ""
                                          }`.trim()
                                        : "Profile"
                                }
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget
                                        .nextElementSibling as HTMLElement | null;

                                    if (fallback) {
                                        fallback.style.display = "flex";
                                    }
                                }}
                            />
                        ) : null}

                        <div
                            className={`${
                                user?.employee?.avatarUrl ? "hidden" : "flex"
                            } h-full w-full items-center justify-center text-[12px] font-bold`}
                        >
                            {initials}
                        </div>
                    </div>
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
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
                </Link>

                <button
                    onClick={handleLogout}
                    title="Logout"
                    className={`flex items-center gap-2.5 rounded-[12px] text-[13px] font-medium text-gray-500 transition-all duration-150 ease-out cursor-pointer cursor-pointer hover:text-red-600 cursor-pointer hover:bg-red-500/10 active:scale-[0.97] ${
                        collapsed
                            ? "justify-center w-9 h-9"
                            : "w-full px-3 py-2"
                    }`}
                >
                    <FiLogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile top bar */}
            <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -ml-2 text-gray-500 rounded-full transition-all duration-150 ease-out cursor-pointer hover:bg-black/[0.05] active:scale-90"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="w-7 h-7 bg-blue-600 rounded-[9px] flex items-center justify-center text-white font-bold text-xs">
                    P360
                </div>
                <span className="text-[15px] font-bold text-gray-900 tracking-tight">
                    PeoplePay360
                </span>
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                >
                    <aside
                        onClick={(e) => e.stopPropagation()}
                        className="h-full w-72 max-w-[80vw] flex flex-col bg-white border-r shadow-2xl"
                    >
                        <SidebarContent
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </aside>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex md:flex-col shrink-0 relative min-w-0 bg-white/90 backdrop-blur-xl border-r border-black/[0.06] h-screen sticky top-0 transition-[width] duration-200 ${
                    collapsed ? "w-[76px]" : "w-64"
                }`}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
