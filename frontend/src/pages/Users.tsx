import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import {
    CheckCircle2,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    UserRoundCheck,
    UserRoundX,
    X,
} from "lucide-react";

type UserRole =
    | "EMPLOYEE"
    | "HR_MANAGER"
    | "HR_PAYROLL_USER"
    | "HR_PAYROLL_MANAGER"
    | "ADMIN";

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
}

interface ManagedUser {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    employeeId?: string | null;
    employee?: EmployeeOption | null;
    createdAt: string;
}

interface UserFormValues {
    email: string;
    password: string;
    role: UserRole;
    employeeId: string;
    isActive: boolean;
}

const roleOptions: Array<{ value: UserRole; label: string }> = [
    { value: "EMPLOYEE", label: "Employee" },
    { value: "HR_MANAGER", label: "HR Manager" },
    { value: "HR_PAYROLL_USER", label: "HR Payroll User" },
    { value: "HR_PAYROLL_MANAGER", label: "HR Payroll Manager" },
    { value: "ADMIN", label: "Admin" },
];

const roleStyles: Record<UserRole, string> = {
    EMPLOYEE: "bg-emerald-500/10 text-emerald-700",
    HR_MANAGER: "bg-purple-500/10 text-purple-700",
    HR_PAYROLL_USER: "bg-blue-500/10 text-blue-700",
    HR_PAYROLL_MANAGER: "bg-indigo-500/10 text-indigo-700",
    ADMIN: "bg-red-500/10 text-red-700",
};

const fieldClass =
    "w-full px-3 py-2 bg-gray-50/80 border border-black/[0.08] rounded-[10px] text-[14px] tracking-[-0.005em] text-gray-900 outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/60";

const labelClass =
    "block text-[13px] font-medium text-gray-600 mb-1 tracking-[-0.005em]";

function roleLabel(role: UserRole) {
    return roleOptions.find((option) => option.value === role)?.label || role;
}

function UserFormModal({
    user,
    employees,
    onClose,
    onSave,
}: {
    user: ManagedUser | null;
    employees: EmployeeOption[];
    onClose: () => void;
    onSave: (values: UserFormValues) => Promise<boolean>;
}) {
    const isEditing = Boolean(user);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<UserFormValues>({
        email: user?.email || "",
        password: "",
        role: user?.role || "EMPLOYEE",
        employeeId: user?.employeeId || "",
        isActive: user?.isActive ?? true,
    });

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isEditing && form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (isEditing && form.password && form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-10 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-[24px] border border-black/[0.06] bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_30px_60px_-15px_rgba(0,0,0,0.3)] [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
                    <div>
                        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">
                            {isEditing ? "Edit User" : "New User"}
                        </h2>
                        <p className="mt-0.5 text-[13px] text-gray-500">
                            {isEditing
                                ? "Update access and account details."
                                : "Create a user account and assign access."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 transition-all hover:bg-black/[0.05] active:scale-90"
                        aria-label="Close user form"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5 p-6">
                    <div>
                        <label className={labelClass}>Email *</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    email: event.target.value,
                                }))
                            }
                            className={fieldClass}
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Password {isEditing ? "(leave blank to keep unchanged)" : "*"}
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    password: event.target.value,
                                }))
                            }
                            className={fieldClass}
                            placeholder={isEditing ? "••••••••" : "Minimum 6 characters"}
                            minLength={isEditing ? undefined : 6}
                            required={!isEditing}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Role *</label>
                            <select
                                value={form.role}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        role: event.target.value as UserRole,
                                    }))
                                }
                                className={fieldClass}
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Employee (optional)</label>
                            <select
                                value={form.employeeId}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        employeeId: event.target.value,
                                    }))
                                }
                                className={fieldClass}
                            >
                                <option value="">No linked employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.firstName} {employee.lastName} ({employee.employeeCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-black/[0.06] bg-gray-50/70 px-3.5 py-3 text-[13px] text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    isActive: event.target.checked,
                                }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                            <span className="block font-medium text-gray-900">Active account</span>
                            <span className="text-gray-500">Inactive users cannot sign in.</span>
                        </span>
                    </label>

                    <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-black/[0.08] px-4 py-2 text-[13px] font-medium tracking-[-0.005em] text-gray-700 transition-all hover:bg-black/[0.03] active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-[13px] font-semibold tracking-[-0.005em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-4px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {isEditing ? "Save Changes" : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Users() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"" | UserRole>("");
    const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [showForm, setShowForm] = useState(false);

    const getErrorMessage = (error: any, fallback: string) => {
        if (error.response?.status === 403) {
            return "You do not have permission to manage users";
        }
        return error.response?.data?.message || fallback;
    };

    const fetchUsers = async () => {
        const response = await api.get("/users");
        setUsers(response.data.data);
    };

    const fetchEmployees = async () => {
        const response = await api.get("/employees");
        setEmployees(response.data.data);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [usersResult, employeesResult] = await Promise.allSettled([
                fetchUsers(),
                fetchEmployees(),
            ]);

            if (usersResult.status === "rejected") {
                toast.error(getErrorMessage(usersResult.reason, "Failed to load users"));
            }
            if (employeesResult.status === "rejected") {
                toast.error(getErrorMessage(employeesResult.reason, "Failed to load employees"));
            }
            setLoading(false);
        };

        void loadData();
    }, []);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return users.filter((user) => {
            const employeeName = user.employee
                ? `${user.employee.firstName} ${user.employee.lastName}`.toLowerCase()
                : "";
            const matchesSearch =
                !normalizedSearch ||
                user.email.toLowerCase().includes(normalizedSearch) ||
                employeeName.includes(normalizedSearch);
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus =
                !statusFilter ||
                (statusFilter === "active" ? user.isActive : !user.isActive);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const availableEmployees = employees.filter((employee) => {
        const linkedUser = users.find((user) => user.employeeId === employee.id);
        return !linkedUser || linkedUser.id === editingUser?.id;
    });

    const openCreate = () => {
        setEditingUser(null);
        setShowForm(true);
    };

    const openEdit = (user: ManagedUser) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    const saveUser = async (values: UserFormValues) => {
        const payload: {
            email: string;
            role: UserRole;
            employeeId: string | null;
            isActive: boolean;
            password?: string;
        } = {
            email: values.email,
            role: values.role,
            employeeId: values.employeeId || null,
            isActive: values.isActive,
        };

        if (values.password) payload.password = values.password;

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, payload);
                toast.success("User updated successfully");
            } else {
                await api.post("/users", payload);
                toast.success("User created successfully");
            }
            await fetchUsers();
            closeForm();
            return true;
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Unable to save user"));
            return false;
        }
    };

    const toggleActive = async (user: ManagedUser) => {
        try {
            await api.put(`/users/${user.id}`, { isActive: !user.isActive });
            await fetchUsers();
            toast.success(`User ${user.isActive ? "deactivated" : "activated"}`);
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Unable to update user status"));
        }
    };

    const deleteUser = async (user: ManagedUser) => {
        if (!window.confirm(`Delete ${user.email}? This action cannot be undone.`)) return;
        try {
            await api.delete(`/users/${user.id}`);
            await fetchUsers();
            toast.success("User deleted successfully");
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Unable to delete user"));
        }
    };

    const activeCount = users.filter((user) => user.isActive).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
                <div className="flex items-center gap-3 text-[15px] text-gray-500">
                    <UserRound className="h-6 w-6 animate-pulse text-blue-600" />
                    Loading users...
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] bg-blue-500/10 text-blue-600">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-gray-900">
                        Users
                    </h1>
                    <p className="mt-1 text-[14px] tracking-[-0.005em] text-gray-500">
                        Manage user accounts, roles, and employee access.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-[13px] font-semibold tracking-[-0.005em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-4px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-700 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    New User
                </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="flex items-center gap-3 rounded-[18px] border border-blue-500/10 bg-blue-500/[0.06] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-600">
                        <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[20px] font-semibold leading-tight text-blue-700">{users.length}</p>
                        <p className="text-[12px] text-gray-500">Total Users</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-[18px] border border-emerald-500/10 bg-emerald-500/[0.06] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <UserRoundCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[20px] font-semibold leading-tight text-emerald-700">{activeCount}</p>
                        <p className="text-[12px] text-gray-500">Active</p>
                    </div>
                </div>
            </div>

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search users..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-full border border-black/[0.08] bg-gray-50/80 py-2 pl-10 pr-4 text-[14px] tracking-[-0.005em] outline-none transition-all focus:border-blue-500/60 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value as "" | UserRole)}
                        className="rounded-full border border-black/[0.08] bg-gray-50/80 px-3.5 py-2 text-[14px] tracking-[-0.005em] outline-none transition-all focus:border-blue-500/60 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                    >
                        <option value="">All Roles</option>
                        {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as "" | "active" | "inactive")
                        }
                        className="rounded-full border border-black/[0.08] bg-gray-50/80 px-3.5 py-2 text-[14px] tracking-[-0.005em] outline-none transition-all focus:border-blue-500/60 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <p className="text-[13px] text-gray-500">{filteredUsers.length} users shown</p>
            </div>

            <div className="overflow-x-auto rounded-[20px] border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_24px_-10px_rgba(0,0,0,0.08)]">
                <table className="w-full min-w-[760px] text-[13px]">
                    <thead>
                        <tr className="border-b border-black/[0.06] bg-gray-50/70">
                            <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">Email</th>
                            <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">Employee</th>
                            <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">Role</th>
                            <th className="px-4 py-3 text-left font-semibold tracking-[0.01em] text-gray-500">Status</th>
                            <th className="px-4 py-3 text-right font-semibold tracking-[0.01em] text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="transition-colors hover:bg-blue-50/50">
                                <td className="px-4 py-3.5 font-medium text-gray-900">{user.email}</td>
                                <td className="px-4 py-3.5 text-gray-600">
                                    {user.employee ? (
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {user.employee.firstName} {user.employee.lastName}
                                            </p>
                                            <p className="text-[12px] text-gray-500">{user.employee.employeeCode}</p>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Not linked</span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleStyles[user.role]}`}>
                                        {roleLabel(user.role)}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            user.isActive
                                                ? "bg-emerald-500/10 text-emerald-700"
                                                : "bg-gray-500/10 text-gray-600"
                                        }`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                        {user.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex justify-end gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(user)}
                                            className="rounded-full p-2 text-gray-500 transition-all hover:bg-blue-500/10 hover:text-blue-600 active:scale-90"
                                            title="Edit user"
                                            aria-label={`Edit ${user.email}`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(user)}
                                            className="rounded-full p-2 text-gray-500 transition-all hover:bg-amber-500/10 hover:text-amber-600 active:scale-90"
                                            title={user.isActive ? "Deactivate user" : "Activate user"}
                                            aria-label={`${user.isActive ? "Deactivate" : "Activate"} ${user.email}`}
                                        >
                                            {user.isActive ? <UserRoundX className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteUser(user)}
                                            className="rounded-full p-2 text-gray-500 transition-all hover:bg-red-500/10 hover:text-red-600 active:scale-90"
                                            title="Delete user"
                                            aria-label={`Delete ${user.email}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="py-16 text-center">
                        <UserRound className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                        <h2 className="text-[16px] font-semibold text-gray-900">No users found</h2>
                        <p className="mt-1 text-[14px] text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            {showForm && (
                <UserFormModal
                    user={editingUser}
                    employees={availableEmployees}
                    onClose={closeForm}
                    onSave={saveUser}
                />
            )}
        </div>
    );
}
