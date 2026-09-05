import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import EmployeeFormModal from "./EmployeeFormModal";

interface Employee {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: string;
    avatarUrl?: string;
    jobProfile?: string;

    manager?: {
        id: string;
        firstName: string;
        lastName: string;
    };

    managerId?: string;
    hireDate: string;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
    employeeType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
    city?: string;
    country?: string;
    bankName?: string;
}

const statusConfig: Record<string, { color: string; bg: string }> = {
    ACTIVE: {
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
    },
    INACTIVE: {
        color: "text-red-600",
        bg: "bg-red-500/10",
    },
    ARCHIVED: {
        color: "text-gray-500",
        bg: "bg-gray-500/10",
    },
};

const typeLabels: Record<string, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
};

/* ============================================================
   Avatar colors used only when an employee has no photo
============================================================ */

const avatarPalette = [
    { bg: "bg-blue-500/10", text: "text-blue-600" },
    { bg: "bg-violet-500/10", text: "text-violet-600" },
    { bg: "bg-amber-500/10", text: "text-amber-600" },
    { bg: "bg-teal-500/10", text: "text-teal-600" },
    { bg: "bg-rose-500/10", text: "text-rose-600" },
    { bg: "bg-indigo-500/10", text: "text-indigo-600" },
];

function getAvatarStyle(id: string) {
    let hash = 0;

    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }

    return avatarPalette[hash % avatarPalette.length];
}

function getInitials(emp: Employee) {
    const first = emp.firstName?.[0] || "";
    const last = emp.lastName?.[0] || "";

    return `${first}${last}`.toUpperCase() || "?";
}

/* ============================================================
   Reusable employee avatar
============================================================ */

function EmployeeAvatar({
    employee,
    size = "normal",
}: {
    employee: Employee;
    size?: "normal" | "small";
}) {
    const avatar = getAvatarStyle(employee.id);
    const [imageError, setImageError] = useState(false);

    const hasImage = Boolean(employee.avatarUrl) && !imageError;

    const sizeClasses =
        size === "small" ? "h-8 w-8 text-[12px]" : "h-9 w-9 text-[13px]";

    return (
        <div
            className={`relative shrink-0 overflow-hidden rounded-full ${sizeClasses} ${
                hasImage
                    ? "border border-slate-200 bg-slate-100"
                    : `${avatar.bg} ${avatar.text}`
            } flex items-center justify-center font-semibold`}
        >
            {hasImage ? (
                <img
                    src={employee.avatarUrl}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                getInitials(employee)
            )}
        </div>
    );
}

export default function EmployeeList() {
    const { hasRole } = useAuth();
    const navigate = useNavigate();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [view, setView] = useState<"list" | "kanban">("list");
    const [showModal, setShowModal] = useState(false);

    const canCreate = hasRole([
        "ADMIN",
        "HR_MANAGER",
        "HR_PAYROLL_USER",
        "HR_PAYROLL_MANAGER",
    ]);

    const openEmployee = (emp: Employee) => navigate(`/employees/${emp.id}`);

    const fetchEmployees = async () => {
        try {
            setLoading(true);

            const params: Record<string, string> = {};

            if (search) {
                params.search = search;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            const response = await api.get("/employees", { params });

            setEmployees(response.data.data);
        } catch (error) {
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchEmployees, 400);

        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    const handleCreate = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleSaved = () => {
        handleModalClose();
        fetchEmployees();
    };

    const now = new Date();

    const activeCount = employees.filter((e) => e.status === "ACTIVE").length;

    const newHiresCount = employees.filter((e) => {
        const d = new Date(e.hireDate);

        return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        );
    }).length;

    const stats = [
        {
            label: "Total Employees",
            value: employees.length,
            accent: "violet",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4c0-1.657-3.134-3-7-3s-7 1.343-7 3v2h14v-2z"
                    />
                </svg>
            ),
        },
        {
            label: "Active",
            value: activeCount,
            accent: "emerald",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
        {
            label: "New This Month",
            value: newHiresCount,
            accent: "amber",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                </svg>
            ),
        },
    ] as const;

    const statAccentClasses: Record<
        string,
        {
            tile: string;
            icon: string;
            value: string;
        }
    > = {
        violet: {
            tile: "bg-violet-500/[0.06] border-violet-500/10",
            icon: "bg-violet-500/15 text-violet-600",
            value: "text-violet-700",
        },
        emerald: {
            tile: "bg-emerald-500/[0.06] border-emerald-500/10",
            icon: "bg-emerald-500/15 text-emerald-600",
            value: "text-emerald-700",
        },
        amber: {
            tile: "bg-amber-500/[0.06] border-amber-500/10",
            icon: "bg-amber-500/15 text-amber-600",
            value: "text-amber-700",
        },
        teal: {
            tile: "bg-teal-500/[0.06] border-teal-500/10",
            icon: "bg-teal-500/15 text-teal-600",
            value: "text-teal-700",
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
                <div className="flex items-center gap-3 text-gray-500">
                    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />

                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>

                    <span className="text-[15px] tracking-[-0.005em]">
                        Loading employees...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="[font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
            {/* ============================================================
                STATS
            ============================================================ */}

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                    const classes = statAccentClasses[stat.accent];

                    return (
                        <div
                            key={stat.label}
                            className={`flex items-center gap-3 rounded-[18px] border p-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 ${classes.tile}`}
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${classes.icon}`}
                            >
                                {stat.icon}
                            </div>

                            <div className="min-w-0">
                                <p
                                    className={`text-[20px] font-semibold leading-tight tracking-[-0.01em] ${classes.value}`}
                                >
                                    {stat.value}
                                </p>

                                <p className="truncate text-[12px] tracking-[-0.005em] text-gray-500">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ============================================================
                TOOLBAR
            ============================================================ */}

            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex w-full items-center gap-3 sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <svg
                            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>

                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-full border border-black/[0.08] bg-gray-50/80 py-2 pl-10 pr-4 text-[14px] tracking-[-0.005em] outline-none transition-all duration-150 ease-out focus:border-indigo-500/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 sm:w-72"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-full border border-black/[0.08] bg-gray-50/80 px-3.5 py-2 text-[14px] tracking-[-0.005em] outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>

                    <span className="text-[13px] text-gray-500">
                        {employees.length} total
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-full bg-gray-100/80 p-1">
                        <button
                            type="button"
                            onClick={() => setView("list")}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.005em] transition-all duration-150 ${
                                view === "list"
                                    ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                                    : "text-gray-500"
                            }`}
                        >
                            ☰ List
                        </button>

                        <button
                            type="button"
                            onClick={() => setView("kanban")}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.005em] transition-all duration-150 ${
                                view === "kanban"
                                    ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                                    : "text-gray-500"
                            }`}
                        >
                            ▦ Kanban
                        </button>
                    </div>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-semibold tracking-[-0.005em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-4px_rgba(79,70,229,0.35)] transition-all duration-150 hover:bg-indigo-700 active:scale-95"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            New Employee
                        </button>
                    )}
                </div>
            </div>

            {/* ============================================================
                EMPTY STATE
            ============================================================ */}

            {employees.length === 0 ? (
                <div className="rounded-[20px] border border-slate-200 bg-white py-16 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                        👥
                    </div>

                    <h3 className="mb-1 text-[17px] font-semibold tracking-[-0.01em] text-gray-900">
                        No employees found
                    </h3>

                    <p className="text-[14px] tracking-[-0.005em] text-gray-500">
                        {search || statusFilter
                            ? "Try adjusting your filters"
                            : "Get started by adding your first employee"}
                    </p>
                </div>
            ) : view === "list" ? (
                /* ========================================================
                   LIST VIEW
                ========================================================= */

                <div className="overflow-x-auto rounded-[20px] border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_24px_-10px_rgba(0,0,0,0.08)]">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-black/[0.06] bg-gray-50/70">
                                <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">
                                    Employee
                                </th>

                                <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">
                                    Code
                                </th>

                                <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">
                                    Position
                                </th>

                                <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">
                                    Type
                                </th>

                                <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">
                                    Hire Date
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-black/[0.05]">
                            {employees.map((emp) => {
                                return (
                                    <tr
                                        key={emp.id}
                                        onClick={() => openEmployee(emp)}
                                        className="cursor-pointer transition-colors duration-150 ease-out hover:bg-indigo-50/40"
                                    >
                                        {/* Employee */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <EmployeeAvatar
                                                    employee={emp}
                                                />

                                                <div className="min-w-0">
                                                    <p className="truncate font-medium tracking-[-0.005em] text-gray-900">
                                                        {emp.firstName}{" "}
                                                        {emp.lastName}
                                                    </p>

                                                    <p className="truncate text-[12px] text-gray-500">
                                                        {emp.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Code */}
                                        <td className="px-4 py-3">
                                            <code className="rounded-full bg-gray-100/80 px-2 py-0.5 font-mono text-[11px] text-gray-600">
                                                {emp.employeeCode}
                                            </code>
                                        </td>

                                        {/* Position */}
                                        <td className="px-4 py-3 text-gray-700">
                                            {emp.jobProfile?.replace(
                                                /_/g,
                                                " ",
                                            ) || "—"}
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium tracking-[0.005em] text-indigo-600">
                                                {typeLabels[emp.employeeType]}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.005em] ${statusConfig[emp.status]?.bg} ${statusConfig[emp.status]?.color}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                                {emp.status}
                                            </span>
                                        </td>

                                        {/* Hire date */}
                                        <td className="px-4 py-3 text-[12px] text-gray-500">
                                            {new Date(
                                                emp.hireDate,
                                            ).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ========================================================
                   KANBAN VIEW
                ========================================================= */

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {["ACTIVE", "INACTIVE", "ARCHIVED"].map((status) => {
                        const filtered = employees.filter(
                            (e) => e.status === status,
                        );

                        const config = statusConfig[status];

                        return (
                            <div
                                key={status}
                                className="rounded-[20px] border border-black/[0.04] bg-gray-50/70 p-4"
                            >
                                <div className="mb-4 flex items-center gap-2">
                                    <span
                                        className={`h-2 w-2 rounded-full ${config.color.replace(
                                            "text-",
                                            "bg-",
                                        )}`}
                                    />

                                    <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-gray-900">
                                        {status}
                                    </h3>

                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                                        {filtered.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {filtered.map((emp) => (
                                        <div
                                            key={emp.id}
                                            onClick={() => openEmployee(emp)}
                                            className="cursor-pointer rounded-[16px] border border-black/[0.05] bg-white p-4 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] active:scale-[0.98]"
                                        >
                                            <div className="mb-2 flex items-center gap-3">
                                                <EmployeeAvatar
                                                    employee={emp}
                                                    size="small"
                                                />

                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-medium tracking-[-0.005em] text-gray-900">
                                                        {emp.firstName}{" "}
                                                        {emp.lastName}
                                                    </p>

                                                    <p className="truncate text-[11px] text-gray-500">
                                                        {emp.jobProfile?.replace(
                                                            /_/g,
                                                            " ",
                                                        ) || "No position"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2">
                                                <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-600">
                                                    {
                                                        typeLabels[
                                                            emp.employeeType
                                                        ]
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {filtered.length === 0 && (
                                        <p className="py-8 text-center text-[13px] text-gray-400">
                                            No employees
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============================================================
                CREATE EMPLOYEE MODAL
            ============================================================ */}

            {showModal && (
                <EmployeeFormModal
                    employee={null}
                    onClose={handleModalClose}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
