import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

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
    departmentId?: string;
    jobPosition?: string;
    jobTitle?: string;
    managerId?: string;
    hireDate: string;
    status: string;
    employeeType: string;
    city?: string;
    state?: string;
    country?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankIFSC?: string;
}

interface Props {
    employee: Employee | null;
    onClose: () => void;
    onSaved: () => void;
}

const fieldClass =
    "w-full px-3 py-2 bg-gray-50/80 border border-black/[0.08] rounded-[10px] text-[14px] tracking-[-0.005em] text-gray-900 outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/60 disabled:bg-gray-100/80 disabled:text-gray-400";

const labelClass =
    "block text-[13px] font-medium text-gray-600 mb-1 tracking-[-0.005em]";

export default function EmployeeFormModal({
    employee,
    onClose,
    onSaved,
}: Props) {
    const isEditing = !!employee;
    const [departments] = useState<Department[]>([]);
    const [saving, setSaving] = useState(false);

    // Materialize on mount, mirror the same path on the way out (spatial consistency).
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const requestClose = (after: () => void) => {
        setVisible(false);
        // Mirrors the 200ms enter transition below; only ever called once per interaction.
        window.setTimeout(after, 200);
    };

    const [form, setForm] = useState({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "",
        departmentId: "",
        jobPosition: "",
        jobTitle: "",
        hireDate: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        employeeType: "FULL_TIME",
        city: "",
        state: "",
        country: "India",
        bankName: "",
        bankAccountNo: "",
        bankIFSC: "",
    });

    useEffect(() => {

        if (employee) {
            setForm({
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone || "",
                gender: employee.gender || "",
                departmentId: employee.departmentId || "",
                jobPosition: employee.jobPosition || "",
                jobTitle: employee.jobTitle || "",
                hireDate: employee.hireDate.split("T")[0],
                status: employee.status,
                employeeType: employee.employeeType,
                city: employee.city || "",
                state: employee.state || "",
                country: employee.country || "India",
                bankName: employee.bankName || "",
                bankAccountNo: employee.bankAccountNo || "",
                bankIFSC: employee.bankIFSC || "",
            });
        }
    }, [employee]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClose = () => requestClose(onClose);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload: any = { ...form };
            if (!payload.departmentId) delete payload.departmentId;
            if (!payload.gender) delete payload.gender;

            if (isEditing) {
                await api.put(`/employees/${employee!.id}`, payload);
                toast.success("Employee updated successfully");
            } else {
                await api.post("/employees", payload);
                toast.success("Employee created successfully");
            }
            requestClose(onSaved);
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.errors?.join(", ") ||
                "Save failed";
            toast.error(message);
            setSaving(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto bg-black/30 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-xl rounded-[24px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none motion-reduce:transform-none ${
                    visible
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 translate-y-2"
                } [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
                    <h2 className="text-[17px] font-semibold text-gray-900 tracking-[-0.01em]">
                        {isEditing ? "Edit Employee" : "New Employee"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full transition-all duration-150 ease-out hover:bg-black/[0.05] active:scale-90"
                    >
                        <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Info */}
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-[-0.005em] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-[11px] font-semibold">
                                1
                            </span>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>
                                    Employee Code *
                                </label>
                                <input
                                    name="employeeCode"
                                    value={form.employeeCode}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    placeholder="EMP006"
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Gender</label>
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    className={fieldClass}
                                >
                                    <option value="">Select</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    First Name *
                                </label>
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Last Name *
                                </label>
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Work Info */}
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-[-0.005em] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center text-[11px] font-semibold">
                                2
                            </span>
                            Work Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Department</label>
                                <select
                                    name="departmentId"
                                    value={form.departmentId}
                                    onChange={handleChange}
                                    className={fieldClass}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Job Position
                                </label>
                                <input
                                    name="jobPosition"
                                    value={form.jobPosition}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Job Title</label>
                                <input
                                    name="jobTitle"
                                    value={form.jobTitle}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hire Date</label>
                                <input
                                    name="hireDate"
                                    type="date"
                                    value={form.hireDate}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Employee Type
                                </label>
                                <select
                                    name="employeeType"
                                    value={form.employeeType}
                                    onChange={handleChange}
                                    className={fieldClass}
                                >
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="INTERN">Intern</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className={fieldClass}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location & Bank */}
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-900 tracking-[-0.005em] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center text-[11px] font-semibold">
                                3
                            </span>
                            Location &amp; Banking
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>City</label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>State</label>
                                <input
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Country</label>
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Bank Name</label>
                                <input
                                    name="bankName"
                                    value={form.bankName}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Account No</label>
                                <input
                                    name="bankAccountNo"
                                    value={form.bankAccountNo}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>IFSC Code</label>
                                <input
                                    name="bankIFSC"
                                    value={form.bankIFSC}
                                    onChange={handleChange}
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border border-black/[0.08] text-gray-700 rounded-full text-[13px] font-medium tracking-[-0.005em] transition-all duration-150 ease-out hover:bg-black/[0.03] active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-full text-[13px] font-semibold tracking-[-0.005em] transition-all duration-150 ease-out hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-4px_rgba(37,99,235,0.4)]"
                        >
                            {saving && (
                                <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                >
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
                            )}
                            {isEditing ? "Update Employee" : "Create Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
