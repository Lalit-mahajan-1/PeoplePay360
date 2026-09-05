import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import EmployeeFormModal from "./EmployeeFormModal";

interface Department {
    id: string;
    name: string;
}

interface Employee {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: string;
    department?: Department;
    departmentId?: string;
    jobPosition?: string;
    jobTitle?: string;
    manager?: { id: string; firstName: string; lastName: string };
    managerId?: string;
    hireDate: string;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
    employeeType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
    city?: string;
    country?: string;
    bankName?: string;
}

const statusConfig: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: "text-emerald-600", bg: "bg-emerald-500/10" },
    INACTIVE: { color: "text-red-600", bg: "bg-red-500/10" },
    ARCHIVED: { color: "text-gray-500", bg: "bg-gray-500/10" },
};

const typeLabels: Record<string, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
};

// Light, pastel accent palette — rotated per employee so avatars read as
// distinct people rather than a wall of the same brand blue.
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
    for (let i = 0; i < id.length; i++)
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return avatarPalette[hash % avatarPalette.length];
}

export default function EmployeeList() {
    const { hasRole } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [view, setView] = useState<"list" | "kanban">("list");
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
        null,
    );

    const canCreate = hasRole([
        "ADMIN",
        "HR_MANAGER",
        "HR_PAYROLL_USER",
        "HR_PAYROLL_MANAGER",
    ]);
    const canEdit = hasRole([
        "ADMIN",
        "HR_MANAGER",
        "HR_PAYROLL_USER",
        "HR_PAYROLL_MANAGER",
    ]);
    const canDelete = hasRole(["ADMIN", "HR_PAYROLL_MANAGER"]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
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

    const handleDelete = async (emp: Employee) => {
        if (!confirm(`Archive ${emp.firstName} ${emp.lastName}?`)) return;
        try {
            await api.delete(`/employees/${emp.id}`);
            toast.success("Employee archived");
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Delete failed");
        }
    };

    const handleEdit = (emp: Employee) => {
        setEditingEmployee(emp);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingEmployee(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingEmployee(null);
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
    const departmentCount = new Set(
        employees
            .map((e) => e.department?.name)
            .filter((name): name is string => Boolean(name)),
    ).size;

    const stats = [
        {
            label: "Total Employees",
            value: employees.length,
            accent: "violet",
            icon: (
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
                    className="w-5 h-5"
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
                    className="w-5 h-5"
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
        {
            label: "Departments",
            value: departmentCount,
            accent: "teal",
            icon: (
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
                        d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4m-4 6h.01M11 14h.01M7 10h.01M7 14h.01"
                    />
                </svg>
            ),
        },
    ] as const;

    const statAccentClasses: Record<
        string,
        { tile: string; icon: string; value: string }
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
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
            {/* Stats — light pastel accents that contrast with the primary blue */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {stats.map((stat) => {
                    const classes = statAccentClasses[stat.accent];
                    return (
                        <div
                            key={stat.label}
                            className={`flex items-center gap-3 rounded-[18px] border p-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 ${classes.tile}`}
                        >
                            <div
                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${classes.icon}`}
                            >
                                {stat.icon}
                            </div>
                            <div className="min-w-0">
                                <p
                                    className={`text-[20px] font-semibold tracking-[-0.01em] leading-tight ${classes.value}`}
                                >
                                    {stat.value}
                                </p>
                                <p className="text-[12px] text-gray-500 tracking-[-0.005em] truncate">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
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
                            className="pl-10 pr-4 py-2 bg-gray-50/80 border border-black/[0.08] rounded-full text-[14px] tracking-[-0.005em] outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/60 w-full sm:w-72"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2 bg-gray-50/80 border border-black/[0.08] rounded-full text-[14px] tracking-[-0.005em] outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-blue-500/15"
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
                    <div className="flex bg-gray-100/80 rounded-full p-1">
                        <button
                            onClick={() => setView("list")}
                            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium tracking-[-0.005em] transition-all duration-150 ease-out active:scale-95 ${
                                view === "list"
                                    ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                                    : "text-gray-500"
                            }`}
                        >
                            ☰ List
                        </button>
                        <button
                            onClick={() => setView("kanban")}
                            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium tracking-[-0.005em] transition-all duration-150 ease-out active:scale-95 ${
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
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-[13px] font-semibold tracking-[-0.005em] transition-all duration-150 ease-out active:scale-95 flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-4px_rgba(37,99,235,0.4)]"
                        >
                            <svg
                                className="w-4 h-4"
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

            {/* Empty State */}
            {employees.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">👥</div>
                    <h3 className="text-[17px] font-semibold text-gray-900 tracking-[-0.01em] mb-1">
                        No employees found
                    </h3>
                    <p className="text-gray-500 text-[14px] tracking-[-0.005em]">
                        {search || statusFilter
                            ? "Try adjusting your filters"
                            : "Get started by adding your first employee"}
                    </p>
                </div>
            ) : view === "list" ? (
                /* List View */
                <div className="overflow-x-auto rounded-[20px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_24px_-10px_rgba(0,0,0,0.08)] bg-white">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-black/[0.06]">
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Employee
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Code
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Department
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Position
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Type
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Status
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                    Hire Date
                                </th>
                                {(canEdit || canDelete) && (
                                    <th className="text-right px-4 py-3 font-semibold text-gray-500 tracking-[0.01em]">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.05]">
                            {employees.map((emp) => {
                                const avatar = getAvatarStyle(emp.id);
                                return (
                                    <tr
                                        key={emp.id}
                                        className="transition-colors duration-150 ease-out hover:bg-blue-50/50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold ${avatar.bg} ${avatar.text}`}
                                                >
                                                    {emp.firstName[0]}
                                                    {emp.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 tracking-[-0.005em]">
                                                        {emp.firstName}{" "}
                                                        {emp.lastName}
                                                    </p>
                                                    <p className="text-[12px] text-gray-500">
                                                        {emp.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-[11px] bg-gray-100/80 px-2 py-0.5 rounded-full font-mono text-gray-600">
                                                {emp.employeeCode}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {emp.department?.name || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {emp.jobPosition || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[11px] font-medium tracking-[0.005em]">
                                                {typeLabels[emp.employeeType]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-[0.005em] ${
                                                    statusConfig[emp.status]?.bg
                                                } ${statusConfig[emp.status]?.color}`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-[12px]">
                                            {new Date(
                                                emp.hireDate,
                                            ).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(emp)
                                                            }
                                                            className="p-1.5 text-gray-400 rounded-full transition-all duration-150 ease-out hover:text-blue-600 hover:bg-blue-500/10 active:scale-90"
                                                            title="Edit"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDelete &&
                                                        emp.status !==
                                                            "ARCHIVED" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        emp,
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 rounded-full transition-all duration-150 ease-out hover:text-red-600 hover:bg-red-500/10 active:scale-90"
                                                                title="Archive"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Kanban View */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["ACTIVE", "INACTIVE", "ARCHIVED"].map((status) => {
                        const filtered = employees.filter(
                            (e) => e.status === status,
                        );
                        const config = statusConfig[status];
                        return (
                            <div
                                key={status}
                                className="bg-gray-50/70 rounded-[20px] p-4 border border-black/[0.04]"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span
                                        className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`}
                                    />
                                    <h3 className="font-semibold text-gray-900 text-[13px] tracking-[-0.005em]">
                                        {status}
                                    </h3>
                                    <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                                        {filtered.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {filtered.map((emp) => (
                                        <div
                                            key={emp.id}
                                            onClick={() =>
                                                canEdit && handleEdit(emp)
                                            }
                                            className="bg-white border border-black/[0.05] rounded-[16px] p-4 transition-all duration-150 ease-out hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[12px] font-semibold">
                                                    {emp.firstName[0]}
                                                    {emp.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-[13px] tracking-[-0.005em]">
                                                        {emp.firstName}{" "}
                                                        {emp.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {emp.jobPosition ||
                                                            "No position"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-gray-500">
                                                    {emp.department?.name ||
                                                        "No dept"}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[11px]">
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
                                        <p className="text-center text-gray-400 text-[13px] py-8">
                                            No employees
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <EmployeeFormModal
                    employee={editingEmployee}
                    onClose={handleModalClose}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
