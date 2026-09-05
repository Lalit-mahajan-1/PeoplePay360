import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowUpRight, CalendarDays, Building2, Wallet, BadgeCheck, Banknote, AlertTriangle, Info, Shield, Mail, FileDown, Award } from "lucide-react";
import { downloadPayslipPDF } from "../utils/pdfGenerator";

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const CAT_STYLES: Record<string, any> = {
    BASIC: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", border: "border-indigo-100" },
    ALLOWANCE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-100" },
    GROSS: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-100" },
    DEDUCTION: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-100" },
    NET: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-100" },
    EMPLOYER_CONTRIBUTION: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-100" },
};
const STATUS: Record<string, any> = {
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    COMPUTED: "bg-blue-50 text-blue-700 border-blue-200",
    VALIDATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function PayslipDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ps, setPs] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (id) load(); }, [id]);
    async function load() {
        try { const r = await api.get(`/payroll/payslips/${id}`); setPs(r.data.data); }
        catch { toast.error("Failed to load"); }
        finally { setLoading(false); }
    }

    if (loading) return <div className="p-10 text-gray-500">Loading payslip...</div>;
    if (!ps) return <div className="p-10 text-gray-500">Payslip not found</div>;

    const emp = ps.employee;
    const earnings = (ps.lines || []).filter((l: any) => ["BASIC", "ALLOWANCE", "EMPLOYER_CONTRIBUTION"].includes(l.category));
    const deductions = (ps.lines || []).filter((l: any) => l.category === "DEDUCTION");
    const totals = (ps.lines || []).filter((l: any) => ["GROSS", "NET"].includes(l.category));

    const token = localStorage.getItem('token');
    const printUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/payroll/payslips/${ps.id}/print?token=${token}`;

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1100px] mx-auto">
            <div className="flex items-center justify-between mb-5">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-semibold transition">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex gap-2">
                    <button onClick={() => downloadPayslipPDF(ps, 'payslip-detail-card')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition cursor-pointer">
                        <FileDown className="w-4 h-4" /> Download / Print PDF
                    </button>
                </div>
            </div>

            <div id="payslip-detail-card" className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
                    <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative flex flex-wrap items-start justify-between gap-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur border border-white/30 text-xs font-bold tracking-wide mb-3">
                                <BadgeCheck className="w-3.5 h-3.5" /> PAYSHEET · PEOPLEPAY360
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Salary Payslip</h1>
                            <div className="text-white/85 text-sm">{ps.payrun?.name} · Period: {ps.periodStart.slice(0, 10)} → {ps.periodEnd.slice(0, 10)}</div>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-white/20 backdrop-blur border-white/30 mb-3">
                                <Shield className="w-3.5 h-3.5" /> Status: <span className={`px-2 py-0.5 rounded-full bg-white text-indigo-600 ml-1`}>{ps.status}</span>
                            </div>
                            <div className="text-[11px] text-white/70 uppercase tracking-wider mb-1">Net Salary Payable</div>
                            <div className="text-4xl md:text-5xl font-black tracking-tight">{fmt(ps.netAmount)}</div>
                            <div className="text-white/80 text-[13px] mt-1">Payment Status: <b className={ps.paymentStatus === "PAID" ? "text-emerald-200" : "text-amber-200"}>{ps.paymentStatus}</b></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-gray-100">
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3"><Award className="w-4 h-4" /> Employee</div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                                {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-lg">{emp.firstName} {emp.lastName}</div>
                                <div className="text-xs font-mono text-gray-400">{emp.employeeCode}</div>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div>📧 {emp.email}</div>
                            {emp.phone && <div>📞 {emp.phone}</div>}
                            <div>🏢 {ps.contract?.department?.name || "—"}</div>
                            <div>💼 {ps.contract?.jobPosition || "—"}</div>
                        </div>
                    </div>
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3"><Banknote className="w-4 h-4" /> Payment Info</div>
                        <div className="space-y-1.5 text-sm text-gray-700">
                            <div><span className="text-gray-400 text-xs uppercase tracking-wider">Worked Days:</span> <b className="float-right text-gray-900">{Number(ps.workedDays)}</b></div>
                            <div><span className="text-gray-400 text-xs uppercase tracking-wider">Structure:</span> <b className="float-right text-gray-900">{ps.salaryStructure?.name}</b></div>
                            <div><span className="text-gray-400 text-xs uppercase tracking-wider">Bank:</span> <b className="float-right text-gray-900">{emp.bankName || "—"}</b></div>
                            <div><span className="text-gray-400 text-xs uppercase tracking-wider">A/C #:</span> <b className="float-right text-gray-900 font-mono">{emp.bankAccountNo ? `XXXX${emp.bankAccountNo.slice(-4)}` : "—"}</b></div>
                            <div><span className="text-gray-400 text-xs uppercase tracking-wider">IFSC:</span> <b className="float-right text-gray-900 font-mono">{emp.bankIFSC || "—"}</b></div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3"><Wallet className="w-4 h-4" /> Summary</div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                                <span className="text-sm text-indigo-700 font-semibold">Basic</span>
                                <span className="font-bold text-indigo-900">{fmt(ps.basicAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1">Allowances <ArrowUpRight className="w-3 h-3" /></span>
                                <span className="font-bold text-emerald-800">+{fmt(ps.allowanceAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                                <span className="text-sm text-rose-700 font-semibold">Deductions</span>
                                <span className="font-bold text-rose-800">−{fmt(ps.deductionAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
                                <span className="text-sm font-bold text-teal-800 uppercase tracking-wide">Take-Home</span>
                                <span className="font-black text-teal-700 text-xl">{fmt(ps.netAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 p-6 md:p-8">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-3 inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Earnings &amp; Allowances</h3>
                        <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-emerald-50/50">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-700">Component</th>
                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-emerald-700">Category</th>
                                        <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-emerald-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {earnings.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-400 text-sm">—</td></tr>}
                                    {earnings.map((l: any) => {
                                        const s = CAT_STYLES[l.category] || CAT_STYLES.BASIC;
                                        return (
                                            <tr key={l.id}>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-900">{l.name}</div>
                                                    <div className="text-[10px] font-mono text-gray-400 uppercase">{l.code}</div>
                                                </td>
                                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${s.bg} ${s.text} ${s.border}`}>{l.category}</span></td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(l.amount)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 mb-3 inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Deductions</h3>
                        <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-rose-50/50">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-rose-700">Component</th>
                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-rose-700">Category</th>
                                        <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-rose-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {deductions.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-400 text-sm">No deductions</td></tr>}
                                    {deductions.map((l: any) => (
                                        <tr key={l.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">{l.name}</div>
                                                <div className="text-[10px] font-mono text-gray-400 uppercase">{l.code}</div>
                                            </td>
                                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-rose-50 text-rose-700 border-rose-100">{l.category}</span></td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-700">−{fmt(l.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {(ps.warnings?.length > 0) && (
                    <div className="mx-6 md:mx-8 mb-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5 mb-2"><AlertTriangle className="w-4 h-4" /> Warnings</h4>
                        <ul className="space-y-1">
                            {ps.warnings.map((w: any) => (
                                <li key={w.id} className="text-xs text-amber-800 flex items-start gap-2"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w.message} <span className="font-mono opacity-60">({w.code})</span></li>
                            ))}
                        </ul>
                    </div>
                )}

                {ps.deliveries?.length > 0 && (
                    <div className="mx-6 md:mx-8 mb-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-2"><Mail className="w-4 h-4" /> Delivery History</h4>
                        <div className="space-y-1">
                            {ps.deliveries.map((d: any) => (
                                <div key={d.id} className="text-xs text-gray-600 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${d.status === "SENT" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                    <b>{d.recipientEmail}</b> — {d.status} on {new Date(d.sentAt || d.createdAt).toLocaleString("en-IN")}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-6 md:p-8 pt-2 border-t border-gray-50 text-center text-xs text-gray-400">
                    This is a system-generated payslip from PeoplePay360 HR &amp; Payroll Platform · Generated {new Date(ps.computedAt || ps.createdAt).toLocaleString("en-IN")}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
                <Link to={`/payroll/payruns/${ps.payrunId}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition">← View Parent Pay Run</Link>
                <button onClick={() => downloadPayslipPDF(ps, 'payslip-detail-card')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-600/30 transition cursor-pointer">
                    <FileDown className="w-4 h-4" /> Print / Save PDF
                </button>
            </div>
        </div>
    );
}
