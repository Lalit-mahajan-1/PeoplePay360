import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, FileText, Edit2, Trash2, Building2, CalendarDays, Search, Filter, X, BadgeCheck, AlertTriangle, CircleCheck } from "lucide-react";

type Contract = {
    id: string; contractNumber: string; employeeId: string;
    employee?: { id: string; firstName: string; lastName: string; employeeCode: string; email: string };
    department?: { id: string; name: string; code: string };
    salaryStructure?: { id: string; name: string; code: string };
    workingSchedule?: { id: string; name: string; code: string };
    startDate: string; endDate?: string | null; wage: number; currencyCode: string;
    jobPosition?: string | null; status: string; notes?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    DRAFT: "bg-amber-500/10 text-amber-600 border-amber-200",
    EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
    TERMINATED: "bg-red-500/10 text-red-600 border-red-200",
};

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Contract | null>(null);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [form, setForm] = useState<any>({
        employeeId: "", departmentId: "", workingScheduleId: "", salaryStructureId: "",
        startDate: new Date().toISOString().slice(0, 10), endDate: "",
        wage: 0, status: "ACTIVE", jobPosition: "", notes: "",
    });

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        try {
            const [c, e, d, s, sc] = await Promise.all([
                api.get("/contracts"),
                api.get("/employees"),
                api.get("/employees/departments"),
                api.get("/working-schedules"),
                api.get("/salary/structures"),
            ]);
            setContracts(c.data.data || []);
            setEmployees(e.data.data || []);
            setDepartments(d.data.data || []);
            setSchedules(s.data.data || []);
            setStructures(sc.data.data || []);
        } catch { toast.error("Failed to load"); }
        finally { setLoading(false); }
    }

    async function loadContracts() {
        try {
            const res = await api.get("/contracts");
            setContracts(res.data.data || []);
        } catch { toast.error("Failed to load contracts"); }
    }

    function openNew() {
        setEditing(null);
        setForm({
            employeeId: "", departmentId: "", workingScheduleId: "", salaryStructureId: "",
            startDate: new Date().toISOString().slice(0, 10), endDate: "",
            wage: 60000, status: "ACTIVE", jobPosition: "", notes: "",
        });
        setShowForm(true);
    }

    function openEdit(c: Contract) {
        setEditing(c);
        setForm({
            employeeId: c.employeeId, departmentId: c.department?.id || "", workingScheduleId: c.workingSchedule?.id || "",
            salaryStructureId: c.salaryStructure?.id || "", startDate: c.startDate.slice(0, 10), endDate: c.endDate ? c.endDate.slice(0, 10) : "",
            wage: Number(c.wage), status: c.status, jobPosition: c.jobPosition || "", notes: c.notes || "",
        });
        setShowForm(true);
    }

    async function save() {
        try {
            const payload = { ...form, endDate: form.endDate || undefined, departmentId: form.departmentId || undefined, workingScheduleId: form.workingScheduleId || undefined };
            if (editing) {
                await api.put(`/contracts/${editing.id}`, payload);
                toast.success("Contract updated");
            } else {
                await api.post("/contracts", payload);
                toast.success("Contract created");
            }
            setShowForm(false);
            loadContracts();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to save"); }
    }

    async function remove(id: string) {
        if (!confirm("Delete this contract?")) return;
        try {
            await api.delete(`/contracts/${id}`);
            toast.success("Contract deleted");
            loadContracts();
        } catch (e: any) { toast.error(e.response?.data?.message || "Delete failed"); }
    }

    const filtered = contracts.filter(c => {
        if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
        if (q) {
            const s = `${c.employee?.firstName} ${c.employee?.lastName} ${c.contractNumber} ${c.jobPosition} ${c.department?.name}`.toLowerCase();
            if (!s.includes(q.toLowerCase())) return false;
        }
        return true;
    });

    const fmtMoney = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1500px] mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-[-0.01em] flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-500" /> Employee Contracts
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Maintain employment contracts and track period-specific terms</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98]">
                    <Plus className="w-4 h-4" /> New Contract
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search employee, contract number, job title..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFT">Draft</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="TERMINATED">Terminated</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 ml-auto">{filtered.length} of {contracts.length} contracts</div>
                </div>
                {loading ? <div className="p-8 text-center text-gray-500 text-sm">Loading...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                                    <th className="px-6 py-3">Contract</th>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Department / Role</th>
                                    <th className="px-6 py-3">Period</th>
                                    <th className="px-6 py-3 text-right">Wage</th>
                                    <th className="px-6 py-3">Structure</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-16 text-gray-400 border-t border-gray-50">No contracts found</td></tr>
                                )}
                                {filtered.map(c => (
                                    <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs font-semibold text-blue-600">{c.contractNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{c.employee?.firstName} {c.employee?.lastName}</div>
                                            <div className="text-xs text-gray-400 font-mono">{c.employee?.employeeCode}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-700"><Building2 className="w-3.5 h-3.5 text-gray-400" />{c.department?.name || "—"}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{c.jobPosition || "—"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-700"><CalendarDays className="w-3.5 h-3.5 text-gray-400" />{c.startDate.slice(0, 10)}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{c.endDate ? `to ${c.endDate.slice(0, 10)}` : "Open-ended"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-gray-900">{fmtMoney(c.wage)}</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">{c.currencyCode} / month</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600">{c.salaryStructure?.name || "—"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${STATUS_STYLES[c.status] || ""}`}>
                                                {c.status === "ACTIVE" ? <CircleCheck className="w-3 h-3" /> : c.status === "DRAFT" ? <AlertTriangle className="w-3 h-3" /> : null}
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => remove(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between z-10">
                            <h2 className="font-bold text-lg text-gray-900">{editing ? "Edit Contract" : "Create Employment Contract"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Employee *</label>
                                    <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                                        <option value="">Select employee...</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Job Position</label>
                                    <input value={form.jobPosition} onChange={e => setForm({ ...form, jobPosition: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Software Engineer" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Department</label>
                                    <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                                        <option value="">—</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Working Schedule</label>
                                    <select value={form.workingScheduleId} onChange={e => setForm({ ...form, workingScheduleId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                                        <option value="">—</option>
                                        {schedules.map(s => <option key={s.id} value={s.id}>{s.name} ({s.weeklyHours}h)</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Salary Structure *</label>
                                    <select value={form.salaryStructureId} onChange={e => setForm({ ...form, salaryStructureId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                                        <option value="">Select structure...</option>
                                        {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Monthly Wage *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                                        <input type="number" value={form.wage} onChange={e => setForm({ ...form, wage: Number(e.target.value) })} className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start Date *</label>
                                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">End Date (leave blank for open)</label>
                                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                                        <option value="DRAFT">Draft</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="EXPIRED">Expired</option>
                                        <option value="TERMINATED">Terminated</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" placeholder="Contract terms, notes..." />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                            <button onClick={save} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-2">
                                <BadgeCheck className="w-4 h-4" /> {editing ? "Update Contract" : "Create Contract"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
