import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, CalendarDays, Layers, Building2, Calculator, CheckCircle2, ShieldCheck, Banknote, Mail, Printer, FileDown, AlertTriangle, AlertCircle, Info, Eye, Users, Receipt } from "lucide-react";

const STATUS_STYLES: Record<string, any> = {
    DRAFT: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Draft" },
    COMPUTED: { color: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Computed" },
    VALIDATED: { color: "bg-indigo-500/10 text-indigo-600 border-indigo-200", label: "Validated" },
    PAID: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Paid" },
};
const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const SEV_STYLES: Record<string, string> = {
    WARNING: "bg-amber-50 border-amber-200 text-amber-700",
    ERROR: "bg-red-50 border-red-200 text-red-700",
    INFO: "bg-blue-50 border-blue-200 text-blue-700",
};
const SEV_ICON: Record<string, any> = { WARNING: AlertTriangle, ERROR: AlertCircle, INFO: Info };

export default function PayrunDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payrun, setPayrun] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => { if (id) load(); }, [id]);
    async function load() {
        try { const r = await api.get(`/payroll/payruns/${id}`); setPayrun(r.data.data); }
        catch { toast.error("Failed to load"); }
        finally { setLoading(false); }
    }

    async function doAction(action: "compute" | "validate" | "mark-paid" | "send-payslips") {
        setBusy(action);
        try {
            let msg = "Success!";
            if (action === "compute") { await api.post(`/payroll/payruns/${id}/compute`); msg = "Payslips computed successfully!"; }
            if (action === "validate") { await api.post(`/payroll/payruns/${id}/validate`); msg = "Pay run validated!"; }
            if (action === "mark-paid") { await api.post(`/payroll/payruns/${id}/mark-paid`); msg = "Pay run marked as PAID!"; }
            if (action === "send-payslips") { const r = await api.post(`/payroll/payruns/${id}/send-payslips`); msg = `Sent ${r.data.data?.sent || 0} payslip emails!`; }
            toast.success(msg); load();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
        finally { setBusy(null); }
    }

    if (loading) return <div className="p-10 text-gray-500">Loading pay run...</div>;
    if (!payrun) return <div className="p-10 text-gray-500">Pay run not found</div>;

    const s = payrun.status;
    const canCompute = s === "DRAFT" || s === "COMPUTED";
    const canValidate = s === "COMPUTED";
    const canPaid = s === "VALIDATED";
    const canSend = s === "VALIDATED" || s === "PAID";

    const steps = [
        { label: "Draft", ok: true },
        { label: "Compute", ok: s !== "DRAFT" },
        { label: "Validate", ok: s === "VALIDATED" || s === "PAID" },
        { label: "Paid", ok: s === "PAID" },
    ];

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1500px] mx-auto">
            <button onClick={() => navigate("/payroll")} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-semibold mb-5 transition">
                <ArrowLeft className="w-4 h-4" /> Back to Payroll Center
            </button>

            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/20 mb-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/10 -translate-y-24 translate-x-24 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h1 className="text-2xl md:text-[28px] font-bold tracking-[-0.02em]">{payrun.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur border border-white/30`}>{STATUS_STYLES[s]?.label || s}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13.5px] text-white/85 mt-3">
                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{payrun.periodStart?.slice(0, 10)} → {payrun.periodEnd?.slice(0, 10)}</span>
                            <span className="inline-flex items-center gap-1.5"><Layers className="w-4 h-4" />{payrun.salaryStructure?.name}</span>
                            {payrun.department && <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" />{payrun.department.name}</span>}
                            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" />{payrun.payslipCount || payrun.employeeCount} employees</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">Total Net Payable</div>
                        <div className="text-3xl md:text-4xl font-extrabold tracking-tight">{fmt(payrun.totalNet)}</div>
                        <div className="text-[13px] text-white/75 mt-1">Avg: {fmt(payrun.averageNet)} / {payrun.payslipCount || 0} payslips</div>
                    </div>
                </div>
                <div className="relative mt-8 grid grid-cols-4 items-center gap-2">
                    {steps.map((st, i) => (
                        <div key={st.label} className="flex items-center gap-2">
                            <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${st.ok ? "bg-white text-indigo-600 shadow-lg" : "bg-white/20 text-white/60 border border-white/30"}`}>{i + 1}</div>
                            <div className={`text-xs md:text-sm font-semibold ${st.ok ? "text-white" : "text-white/55"}`}>{st.label}</div>
                            {i < steps.length - 1 && <div className={`flex-1 h-1 rounded-full ${steps[i + 1].ok ? "bg-white" : "bg-white/20"} mx-1`} />}
                        </div>
                    ))}
                </div>
                <div className="relative mt-6 flex flex-wrap gap-3">
                    <button onClick={() => doAction("compute")} disabled={!canCompute || !!busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-indigo-700 shadow-md hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <Calculator className="w-4 h-4" /> {busy === "compute" ? "Computing..." : (s === "DRAFT" ? "Compute Payslips" : "Re-compute")}
                    </button>
                    <button onClick={() => doAction("validate")} disabled={!canValidate || !!busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-400/40 text-white border border-white/40 backdrop-blur hover:bg-indigo-400/60 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <ShieldCheck className="w-4 h-4" /> {busy === "validate" ? "Validating..." : "Validate"}
                    </button>
                    <button onClick={() => doAction("mark-paid")} disabled={!canPaid || !!busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <Banknote className="w-4 h-4" /> {busy === "mark-paid" ? "Processing..." : "Mark as Paid"}
                    </button>
                    <button onClick={() => doAction("send-payslips")} disabled={!canSend || !!busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/15 text-white border border-white/30 backdrop-blur hover:bg-white/25 transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto">
                        <Mail className="w-4 h-4" /> {busy === "send-payslips" ? "Sending..." : "Send All Payslips"}
                    </button>
                </div>
            </div>

            {(payrun.warnings?.length > 0 || (payrun.payslips || []).some((ps: any) => ps.warnings?.length > 0)) && (
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm mb-6 overflow-hidden">
                    <div className="p-5 border-b border-amber-50 bg-amber-50/40">
                        <h3 className="font-bold text-gray-900 inline-flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Warnings &amp; Alerts</h3>
                    </div>
                    <div className="p-5 space-y-2">
                        {(payrun.warnings || []).concat((payrun.payslips || []).flatMap((ps: any) => (ps.warnings || []).map((w: any) => ({ ...w, payslipEmployee: ps.employee })))).map((w: any) => {
                            const Icon = SEV_ICON[w.severity] || Info;
                            return (
                                <div key={w.id} className={`rounded-xl border px-4 py-3 ${SEV_STYLES[w.severity] || ""}`}>
                                    <div className="flex items-start gap-3">
                                        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div className="flex-1 text-sm">
                                            <div className="font-semibold">{w.message}</div>
                                            {w.payslipEmployee && <div className="text-xs mt-0.5 opacity-80">{w.payslipEmployee.firstName} {w.payslipEmployee.lastName} ({w.payslipEmployee.employeeCode})</div>}
                                            <div className="text-[10px] mt-1 opacity-70 font-mono uppercase">{w.code}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {payrun.payslipCount > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: "Total Basic", val: payrun.totalBasic, color: "indigo" },
                        { label: "Allowances", val: payrun.totalAllowances, color: "emerald" },
                        { label: "Deductions", val: payrun.totalDeductions, color: "rose" },
                        { label: "Gross", val: payrun.totalGross, color: "blue" },
                        { label: "Net Payable", val: payrun.totalNet, color: "teal" },
                    ].map((k) => (
                        <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{k.label}</div>
                            <div className="text-xl font-extrabold text-gray-900 mt-1">{fmt(k.val)}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500" /> Generated Payslips ({payrun.payslips?.length || 0})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-5 py-3">Employee</th>
                                <th className="px-5 py-3 text-right">Worked</th>
                                <th className="px-5 py-3 text-right">Basic</th>
                                <th className="px-5 py-3 text-right">Allowances</th>
                                <th className="px-5 py-3 text-right">Deductions</th>
                                <th className="px-5 py-3 text-right">Gross</th>
                                <th className="px-5 py-3 text-right">Net</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!payrun.payslips || payrun.payslips.length === 0) && (
                                <tr><td colSpan={9} className="text-center py-16 text-gray-400 border-t border-gray-50">
                                    <div className="flex flex-col items-center gap-2">
                                        <Calculator className="w-10 h-10 text-gray-300" />
                                        <p className="text-sm">No payslips generated yet — click "Compute Payslips" to begin.</p>
                                    </div>
                                </td></tr>
                            )}
                            {(payrun.payslips || []).map((ps: any) => (
                                <tr key={ps.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">{ps.employee.firstName[0]}{ps.employee.lastName[0]}</div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{ps.employee.firstName} {ps.employee.lastName}</div>
                                                <div className="text-xs text-gray-400 font-mono">{ps.employee.employeeCode}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold text-gray-700">{Number(ps.workedDays)}</td>
                                    <td className="px-5 py-4 text-right text-indigo-600 font-medium">{fmt(ps.basicAmount)}</td>
                                    <td className="px-5 py-4 text-right text-emerald-600 font-medium">+{fmt(ps.allowanceAmount)}</td>
                                    <td className="px-5 py-4 text-right text-red-500 font-medium">−{fmt(ps.deductionAmount)}</td>
                                    <td className="px-5 py-4 text-right text-blue-600 font-bold">{fmt(ps.grossAmount)}</td>
                                    <td className="px-5 py-4 text-right"><div className="font-extrabold text-teal-700 text-base">{fmt(ps.netAmount)}</div></td>
                                    <td className="px-5 py-4"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${STATUS_STYLES[ps.status]?.color || STATUS_STYLES.DRAFT.color}`}>{STATUS_STYLES[ps.status]?.label || ps.status}</span></td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link to={`/payslips/${ps.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition"><Eye className="w-3.5 h-3.5" />View</Link>
                                            <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/payroll/payslips/${ps.id}/print`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition"><FileDown className="w-3.5 h-3.5" />PDF</a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
