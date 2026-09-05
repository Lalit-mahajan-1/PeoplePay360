import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, Wallet, CalendarDays, Layers, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, X, Search, Filter, Building2, XCircle, Banknote, Mail, Printer, Eye, FileDown } from "lucide-react";

const STATUS_STYLES: Record<string, any> = {
    DRAFT: { color: "bg-amber-500/10 text-amber-600 border-amber-200", dot: "bg-amber-500", label: "Draft" },
    COMPUTED: { color: "bg-blue-500/10 text-blue-600 border-blue-200", dot: "bg-blue-500", label: "Computed" },
    VALIDATED: { color: "bg-indigo-500/10 text-indigo-600 border-indigo-200", dot: "bg-indigo-500", label: "Validated" },
    PAID: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", dot: "bg-emerald-500", label: "Paid" },
    CANCELLED: { color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", label: "Cancelled" },
};
const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function PayrollPage() {
    const navigate = useNavigate();
    const [payruns, setPayruns] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showWizard, setShowWizard] = useState(false);
    const [wizStep, setWizStep] = useState(1);
    const [wizForm, setWizForm] = useState<any>({ salaryStructureId: "", periodStart: "", periodEnd: "", departmentId: "", name: "", employeeIds: [] as string[] });
    const [eligible, setEligible] = useState<any[]>([]);
    const [wizLoading, setWizLoading] = useState(false);

    useEffect(() => { load(); }, []);
    async function load() {
        try {
            const [p, s, d] = await Promise.all([api.get("/payroll/payruns"), api.get("/salary/structures"), api.get("/employees/departments")]);
            setPayruns(p.data.data || []);
            setStructures(s.data.data || []);
            setDepartments(d.data.data || []);
        } catch { toast.error("Failed to load"); }
        finally { setLoading(false); }
    }

    function openWizard() {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const month = d.toLocaleString("en-US", { month: "long", year: "numeric" });
        setWizForm({ salaryStructureId: structures[0]?.id || "", periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10), departmentId: "", name: `${month} Payroll`, employeeIds: [] });
        setWizStep(1); setShowWizard(true); setEligible([]);
    }

    async function wizNext() {
        if (wizStep === 1) {
            if (!wizForm.salaryStructureId || !wizForm.periodStart || !wizForm.periodEnd || !wizForm.name) {
                toast.error("Fill all required fields"); return;
            }
            setWizLoading(true);
            try {
                const params = new URLSearchParams({ salaryStructureId: wizForm.salaryStructureId, periodStart: wizForm.periodStart, periodEnd: wizForm.periodEnd });
                if (wizForm.departmentId) params.set("departmentId", wizForm.departmentId);
                const res = await api.get(`/payroll/eligible?${params}`);
                setEligible(res.data.data || []);
                setWizForm({ ...wizForm, employeeIds: (res.data.data || []).map((e: any) => e.id) });
                setWizStep(2);
            } catch { toast.error("Failed to fetch eligible employees"); }
            finally { setWizLoading(false); }
        }
    }

    function toggleEmp(id: string) {
        const has = wizForm.employeeIds.includes(id);
        setWizForm({ ...wizForm, employeeIds: has ? wizForm.employeeIds.filter((x: string) => x !== id) : [...wizForm.employeeIds, id] });
    }
    function selectAll() { setWizForm({ ...wizForm, employeeIds: eligible.map((e: any) => e.id) }); }
    function clearAll() { setWizForm({ ...wizForm, employeeIds: [] }); }

    async function wizFinish() {
        if (wizForm.employeeIds.length === 0) { toast.error("Select at least one employee"); return; }
        setWizLoading(true);
        try {
            const res = await api.post("/payroll/payruns", wizForm);
            toast.success("Payrun created successfully!");
            setShowWizard(false);
            navigate(`/payroll/payruns/${res.data.data.id}`);
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to create"); }
        finally { setWizLoading(false); }
    }

    const filtered = payruns.filter(p => {
        if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
        if (q && !`${p.name} ${p.salaryStructure?.name}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1500px] mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-[-0.01em] flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-blue-600" /> Payroll Center
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Create pay runs, generate payslips, and process salary payments</p>
                </div>
                <button onClick={openWizard} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition active:scale-[0.98]">
                    <Plus className="w-4 h-4" /> New Pay Run
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search pay runs..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                            <option value="ALL">All Statuses</option>
                            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 ml-auto">{filtered.length} / {payruns.length} pay runs</div>
                </div>
                {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                                    <th className="px-6 py-3">Pay Run</th>
                                    <th className="px-6 py-3">Period</th>
                                    <th className="px-6 py-3">Structure</th>
                                    <th className="px-6 py-3 text-right">Payslips</th>
                                    <th className="px-6 py-3 text-right">Total Net</th>
                                    <th className="px-6 py-3 text-right">Avg Salary</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-20 text-gray-400 border-t border-gray-50">
                                    <div className="inline-flex flex-col items-center gap-2">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><Wallet className="w-7 h-7" /></div>
                                        <div className="text-sm">No pay runs yet. Start with "New Pay Run"!</div>
                                    </div>
                                </td></tr>}
                                {filtered.map(p => (
                                    <tr key={p.id} onClick={() => navigate(`/payroll/payruns/${p.id}`)} className="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer transition">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{p.name}</div>
                                            <div className="text-xs text-gray-400">Created {new Date(p.createdAt).toLocaleDateString("en-IN")}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-700"><CalendarDays className="w-3.5 h-3.5 text-gray-400" />{p.periodStart.slice(0, 10)}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 ml-5">to {p.periodEnd.slice(0, 10)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-700"><Layers className="w-3.5 h-3.5 text-gray-400" />{p.salaryStructure?.name || "-"}</div>
                                            {p.department?.name && <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Building2 className="w-3 h-3" />{p.department.name}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right"><div className="font-bold text-gray-900 text-base">{p.payslipCount || 0}</div></td>
                                        <td className="px-6 py-4 text-right"><div className="font-bold text-emerald-600 text-base">{fmt(p.totalNet)}</div></td>
                                        <td className="px-6 py-4 text-right text-gray-700 font-medium">{fmt(p.averageNet)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${STATUS_STYLES[p.status]?.color || ""}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[p.status]?.dot || ""}`} />
                                                {STATUS_STYLES[p.status]?.label || p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/payroll/payruns/${p.id}`); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition inline-flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showWizard && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowWizard(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-600" /> Create New Pay Run</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Step {wizStep} of 2: {wizStep === 1 ? "Define scope and period" : "Select employees to include"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-10 rounded-full ${wizStep >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
                                <div className={`h-2.5 w-10 rounded-full ${wizStep >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
                                <button onClick={() => setShowWizard(false)} className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto flex-1">
                            {wizStep === 1 && (
                                <div className="space-y-5 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pay Run Name *</label>
                                            <input value={wizForm.name} onChange={e => setWizForm({ ...wizForm, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="August 2026 Payroll" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Salary Structure *</label>
                                            <select value={wizForm.salaryStructureId} onChange={e => setWizForm({ ...wizForm, salaryStructureId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                                                <option value="">Select structure...</option>
                                                {structures.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ruleCount || 0} rules)</option>)}
                                            </select></div>
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Period Start *</label>
                                            <input type="date" value={wizForm.periodStart} onChange={e => setWizForm({ ...wizForm, periodStart: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Period End *</label>
                                            <input type="date" value={wizForm.periodEnd} onChange={e => setWizForm({ ...wizForm, periodEnd: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
                                        <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Department (optional, leave blank for all)</label>
                                            <select value={wizForm.departmentId} onChange={e => setWizForm({ ...wizForm, departmentId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                                                <option value="">All Departments</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select></div>
                                    </div>
                                </div>
                            )}
                            {wizStep === 2 && (
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                        <div className="text-sm font-semibold text-gray-700">{eligible.length} eligible employees · {wizForm.employeeIds.length} selected</div>
                                        <div className="flex gap-2">
                                            <button onClick={selectAll} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">Select All</button>
                                            <button onClick={clearAll} className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">Clear</button>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 divide-y divide-gray-50 max-h-[50vh] overflow-y-auto">
                                        {eligible.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">No eligible employees for this structure + period combination.</div>}
                                        {eligible.map((e: any) => {
                                            const sel = wizForm.employeeIds.includes(e.id);
                                            const c = e.activeContract;
                                            return (
                                                <label key={e.id} className={`flex items-center gap-4 p-4 cursor-pointer transition ${sel ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                                                    <input type="checkbox" checked={sel} onChange={() => toggleEmp(e.id)} className="w-4.5 h-4.5 rounded text-blue-600 w-5 h-5" />
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">{e.firstName[0]}{e.lastName[0]}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900">{e.firstName} {e.lastName}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{e.employeeCode} · {e.department?.name || "-"} · {c?.jobPosition || "-"}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-emerald-600 text-sm">{fmt(Number(c?.wage || 0))}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">contract wage</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
                            <div>
                                {wizStep === 2 && wizForm.employeeIds.length > 0 && (
                                    <div className="text-sm"><span className="text-gray-500">Est. Gross: </span><b>{fmt(eligible.filter((e: any) => wizForm.employeeIds.includes(e.id)).reduce((s: number, e: any) => s + Number(e.activeContract?.wage || 0), 0))}</b></div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                {wizStep > 1 && <button onClick={() => setWizStep(wizStep - 1)} disabled={wizLoading} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ArrowLeft className="w-4 h-4" />Back</button>}
                                {wizStep < 2 && <button onClick={wizNext} disabled={wizLoading} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50">{wizLoading ? "Loading..." : <>Continue<ArrowRight className="w-4 h-4" /></>}</button>}
                                {wizStep === 2 && <button onClick={wizFinish} disabled={wizLoading} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50">{wizLoading ? "Creating..." : <><CheckCircle2 className="w-4 h-4" />Create Pay Run</>}</button>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
