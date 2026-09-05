import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Pencil,
    Archive as ArchiveIcon,
    CalendarClock,
    FileText,
    Clock3,
} from "lucide-react";

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
    avatarUrl?: string;
    department?: Department;
    departmentId?: string;
    jobPosition?: string;
    jobTitle?: string;
    hireDate: string;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
    employeeType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
    city?: string;
    state?: string;
    country?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankIFSC?: string;
}

const typeLabels: Record<string, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
};

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

const appleSpring = {
    type: "spring" as const,
    bounce: 0,
    duration: 0.4,
};

const fieldClass =
    "w-full px-3 py-2 bg-gray-50/80 border border-black/[0.08] rounded-[10px] text-[14px] text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/60 disabled:bg-gray-100/80 disabled:text-gray-400";

const labelClass =
    "block text-[12.5px] font-medium text-gray-500 mb-1 tracking-[0.01em]";

function StaticField({ label, value }: { label: string; value: string }) {
    return (
        <motion.div layout transition={appleSpring}>
            <p className={labelClass}>{label}</p>

            <div className="w-full px-3 py-2 bg-gray-50/60 border border-black/[0.06] rounded-[10px] text-[14px] text-gray-800 min-h-[38px] flex items-center">
                {value || <span className="text-gray-400">—</span>}
            </div>
        </motion.div>
    );
}

function EmployeeAvatar({ employee }: { employee: Employee }) {
    const [imageError, setImageError] = useState(false);

    const avatar = getAvatarStyle(employee.id);

    const initials =
        `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();

    const showImage = Boolean(employee.avatarUrl) && !imageError;

    return (
        <div
            className={`w-20 h-20 shrink-0 rounded-[18px] overflow-hidden flex items-center justify-center text-[20px] font-semibold ${avatar.bg} ${avatar.text}`}
        >
            {showImage ? (
                <img
                    src={employee.avatarUrl}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                initials
            )}
        </div>
    );
}

export default function EmployeeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasRole } = useAuth();

    const canEdit = hasRole([
        "ADMIN",
        "HR_MANAGER",
        "HR_PAYROLL_USER",
        "HR_PAYROLL_MANAGER",
    ]);

    const canDelete = hasRole(["ADMIN", "HR_PAYROLL_MANAGER"]);

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<"work" | "private">("work");

    const [counts, setCounts] = useState({
        timeOff: 0,
        contracts: 0,
        attendance: 0,
    });

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "",
        departmentId: "",
        jobPosition: "",
        jobTitle: "",
        hireDate: "",
        status: "ACTIVE",
        employeeType: "FULL_TIME",
        city: "",
        state: "",
        country: "",
        bankName: "",
        bankAccountNo: "",
        bankIFSC: "",
    });

    const loadEmployee = async () => {
        try {
            setLoading(true);

            const res = await api.get(`/employees/${id}`);
            const emp: Employee = res.data.data;

            setEmployee(emp);

            setForm({
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                phone: emp.phone || "",
                gender: emp.gender || "",
                departmentId: emp.departmentId || "",
                jobPosition: emp.jobPosition || "",
                jobTitle: emp.jobTitle || "",
                hireDate: emp.hireDate.split("T")[0],
                status: emp.status,
                employeeType: emp.employeeType,
                city: emp.city || "",
                state: emp.state || "",
                country: emp.country || "",
                bankName: emp.bankName || "",
                bankAccountNo: emp.bankAccountNo || "",
                bankIFSC: emp.bankIFSC || "",
            });
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const loadCounts = async () => {
        const fetchCount = async (url: string) => {
            try {
                const res = await api.get(url, {
                    params: { employeeId: id },
                });

                const data = res.data?.data;

                return Array.isArray(data) ? data.length : 0;
            } catch {
                return 0;
            }
        };

        const [timeOff, contracts, attendance] = await Promise.all([
            fetchCount("/time-off"),
            fetchCount("/contracts"),
            fetchCount("/attendance"),
        ]);

        setCounts({
            timeOff,
            contracts,
            attendance,
        });
    };

    const loadDepartments = async () => {
        try {
            const res = await api.get("/employees/departments");
            setDepartments(res.data.data);
        } catch {
            // silent
        }
    };

    useEffect(() => {
        if (!id) return;

        loadEmployee();
        loadDepartments();
        loadCounts();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleCancel = () => {
        if (employee) {
            setForm({
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
                country: employee.country || "",
                bankName: employee.bankName || "",
                bankAccountNo: employee.bankAccountNo || "",
                bankIFSC: employee.bankIFSC || "",
            });
        }

        setEditMode(false);
    };

    const handleSave = async () => {
        if (!employee) return;

        setSaving(true);

        try {
            const payload: any = { ...form };

            if (!payload.departmentId) {
                delete payload.departmentId;
            }

            if (!payload.gender) {
                delete payload.gender;
            }

            await api.put(`/employees/${employee.id}`, payload);

            toast.success("Employee updated successfully");

            setEditMode(false);

            await loadEmployee();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!employee) return;

        if (!confirm(`Archive ${employee.firstName} ${employee.lastName}?`)) {
            return;
        }

        try {
            await api.delete(`/employees/${employee.id}`);

            toast.success("Employee archived");

            navigate("/");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Archive failed");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 font-[system-ui,sans-serif]">
                <div className="flex items-center gap-3 text-gray-500">
                    <span className="text-[15px]">Loading employee...</span>
                </div>
            </div>
        );
    }

    if (notFound || !employee) {
        return (
            <div className="py-16 font-[system-ui,sans-serif]">
                <h1 className="text-[20px] font-semibold text-gray-900 mb-2 tracking-[-0.02em]">
                    Employee not found
                </h1>

                <Link
                    to="/"
                    className="text-blue-600 text-[14px] font-medium hover:underline"
                >
                    ← Back to employees
                </Link>
            </div>
        );
    }

    const fullName = `${employee.firstName} ${employee.lastName}`;

    return (
        <div className="font-[system-ui,sans-serif] pb-12">
            {/* Toolbar */}
            <div className="sticky px-10 top-0 z-10 bg-white/70 backdrop-blur-[20px] saturate-[180%] py-5">
                <div className="flex items-center gap-1.5 text-[13px] mb-1">
                    <Link
                        to="/"
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Employees
                    </Link>

                    <span className="text-gray-300">/</span>

                    <span className="text-gray-900 font-medium">
                        {fullName}
                    </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                    <div className="flex items-center gap-2">
                        {editMode ? (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-[13px] font-medium"
                                >
                                    Cancel
                                </motion.button>
                            </>
                        ) : (
                            <>
                                {canEdit && (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setEditMode(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-900 rounded-full text-[13px] font-semibold"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Edit
                                    </motion.button>
                                )}

                                {canDelete &&
                                    employee.status !== "ARCHIVED" && (
                                        <motion.button
                                            whileTap={{
                                                scale: 0.97,
                                            }}
                                            onClick={handleArchive}
                                            className="flex items-center gap-1.5 px-4 py-2 text-gray-500 rounded-full text-[13px] font-medium hover:text-red-600 hover:bg-red-500/10"
                                        >
                                            <ArchiveIcon className="w-3.5 h-3.5" />
                                            Archive
                                        </motion.button>
                                    )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                                navigate(`/time-off?employeeId=${employee.id}`)
                            }
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/80 text-gray-700 text-[12.5px] font-medium"
                        >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Time Off{" "}
                            <span className="font-semibold">
                                {counts.timeOff}
                            </span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                                navigate(`/contracts?employeeId=${employee.id}`)
                            }
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/80 text-gray-700 text-[12.5px] font-medium"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Contracts{" "}
                            <span className="font-semibold">
                                {counts.contracts}
                            </span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                                navigate(
                                    `/attendance?employeeId=${employee.id}`,
                                )
                            }
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/80 text-gray-700 text-[12.5px] font-medium"
                        >
                            <Clock3 className="w-3.5 h-3.5" />
                            Attendance{" "}
                            <span className="font-semibold">
                                {counts.attendance}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Employee Header */}
            <motion.div layout transition={appleSpring} className="p-8 mt-6">
                <div className="flex items-center gap-5">
                    <EmployeeAvatar employee={employee} />

                    <div className="min-w-0">
                        <h1 className="text-[24px] font-semibold text-gray-900 tracking-[-0.02em] leading-[1.1] truncate mb-1">
                            {fullName}
                        </h1>

                        <p className="text-[20px] text-gray-500 truncate">
                            {employee.jobPosition || "No position"} •{" "}
                            {employee.department?.name || "No department"}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 mt-8 border-b border-black/[0.06] relative">
                    {(["work", "private"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`relative pb-3 text-[14px] font-medium transition-colors ${
                                tab === t
                                    ? "text-gray-900"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {t === "work"
                                ? "Work Information"
                                : "Private Information"}

                            {tab === t && (
                                <motion.div
                                    layoutId="activeTab"
                                    transition={appleSpring}
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={tab + (editMode ? "-edit" : "-static")}
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.98,
                        }}
                        transition={appleSpring}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mt-6"
                    >
                        {tab === "work" ? (
                            editMode ? (
                                <>
                                    <motion.div layout transition={appleSpring}>
                                        <label className={labelClass}>
                                            Department
                                        </label>

                                        <select
                                            name="departmentId"
                                            value={form.departmentId}
                                            onChange={handleChange}
                                            className={fieldClass}
                                        >
                                            <option value="">
                                                Select Department
                                            </option>

                                            {departments.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </motion.div>

                                    <motion.div layout transition={appleSpring}>
                                        <label className={labelClass}>
                                            Job Position
                                        </label>

                                        <input
                                            name="jobPosition"
                                            value={form.jobPosition}
                                            onChange={handleChange}
                                            className={fieldClass}
                                        />
                                    </motion.div>

                                    <motion.div layout transition={appleSpring}>
                                        <label className={labelClass}>
                                            Job Title
                                        </label>

                                        <input
                                            name="jobTitle"
                                            value={form.jobTitle}
                                            onChange={handleChange}
                                            className={fieldClass}
                                        />
                                    </motion.div>

                                    <motion.div layout transition={appleSpring}>
                                        <label className={labelClass}>
                                            Employee Type
                                        </label>

                                        <select
                                            name="employeeType"
                                            value={form.employeeType}
                                            onChange={handleChange}
                                            className={fieldClass}
                                        >
                                            <option value="FULL_TIME">
                                                Full Time
                                            </option>
                                            <option value="PART_TIME">
                                                Part Time
                                            </option>
                                            <option value="CONTRACT">
                                                Contract
                                            </option>
                                            <option value="INTERN">
                                                Intern
                                            </option>
                                        </select>
                                    </motion.div>

                                    <motion.div layout transition={appleSpring}>
                                        <label className={labelClass}>
                                            Status
                                        </label>

                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className={fieldClass}
                                        >
                                            <option value="ACTIVE">
                                                Active
                                            </option>
                                            <option value="INACTIVE">
                                                Inactive
                                            </option>
                                            <option value="ARCHIVED">
                                                Archived
                                            </option>
                                        </select>
                                    </motion.div>

                                    <motion.div layout transition={appleSpring}>
                                        <label className={labelClass}>
                                            Hire Date
                                        </label>

                                        <input
                                            name="hireDate"
                                            type="date"
                                            value={form.hireDate}
                                            onChange={handleChange}
                                            className={fieldClass}
                                        />
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    <StaticField
                                        label="Department"
                                        value={employee.department?.name || ""}
                                    />

                                    <StaticField
                                        label="Job Position"
                                        value={employee.jobPosition || ""}
                                    />

                                    <StaticField
                                        label="Job Title"
                                        value={employee.jobTitle || ""}
                                    />

                                    <StaticField
                                        label="Employee Type"
                                        value={
                                            typeLabels[employee.employeeType]
                                        }
                                    />

                                    <StaticField
                                        label="Status"
                                        value={
                                            employee.status.charAt(0) +
                                            employee.status
                                                .slice(1)
                                                .toLowerCase()
                                        }
                                    />

                                    <StaticField
                                        label="Hire Date"
                                        value={new Date(
                                            employee.hireDate,
                                        ).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    />
                                </>
                            )
                        ) : editMode ? (
                            <>
                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>
                                        First Name
                                    </label>

                                    <input
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>
                                        Last Name
                                    </label>

                                    <input
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>Email</label>

                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>Phone</label>

                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
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
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>City</label>

                                    <input
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>State</label>

                                    <input
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>
                                        Country
                                    </label>

                                    <input
                                        name="country"
                                        value={form.country}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>
                                        Bank Name
                                    </label>

                                    <input
                                        name="bankName"
                                        value={form.bankName}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>
                                        Account No
                                    </label>

                                    <input
                                        name="bankAccountNo"
                                        value={form.bankAccountNo}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>

                                <motion.div layout transition={appleSpring}>
                                    <label className={labelClass}>
                                        IFSC Code
                                    </label>

                                    <input
                                        name="bankIFSC"
                                        value={form.bankIFSC}
                                        onChange={handleChange}
                                        className={fieldClass}
                                    />
                                </motion.div>
                            </>
                        ) : (
                            <>
                                <StaticField
                                    label="First Name"
                                    value={employee.firstName}
                                />

                                <StaticField
                                    label="Last Name"
                                    value={employee.lastName}
                                />

                                <StaticField
                                    label="Email"
                                    value={employee.email}
                                />

                                <StaticField
                                    label="Phone"
                                    value={employee.phone || ""}
                                />

                                <StaticField
                                    label="Gender"
                                    value={employee.gender || ""}
                                />

                                <StaticField
                                    label="City"
                                    value={employee.city || ""}
                                />

                                <StaticField
                                    label="State"
                                    value={employee.state || ""}
                                />

                                <StaticField
                                    label="Country"
                                    value={employee.country || ""}
                                />

                                <StaticField
                                    label="Bank Name"
                                    value={employee.bankName || ""}
                                />

                                <StaticField
                                    label="Account No"
                                    value={employee.bankAccountNo || ""}
                                />

                                <StaticField
                                    label="IFSC Code"
                                    value={employee.bankIFSC || ""}
                                />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
