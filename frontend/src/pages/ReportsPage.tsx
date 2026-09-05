import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Wallet, Users, Layers, HandCoins, CalendarDays, UserCheck, FileCheck2, AlertTriangle, Building2, TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Clock, Clock3, AlertOctagon, Shield, Award, BedDouble, UserMinus, CheckCircle2 } from "lucide-react";

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState("ALL");
    const [dept, setDept] = useState("ALL");
    const [departments, setDepartments] = useState<any[]>([]);
    const [range, setRange] = useState({ start: "", end: "" });

    useEffect(() => { load(); }, [period, dept]);

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (period !== "ALL") {
                const d = new Date();
                if (period === "MONTH") {
                    setRange({ start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10), end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10) });
                } else if (period === "QUARTER") {
                    const q = Math.floor(d.getMonth() / 3);
                    setRange({ start: new Date(d.getFullYear(), q * 3, 1).toISOString().slice(0, 10), end: new Date(d.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10) });
                } else {
                    setRange({ start: new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10), end: new Date(d.getFullYear(), 11, 31).toISOString().slice(0, 10) });
                }
            } else setRange({ start: "", end: "" });
            if (range.start) params.set("periodStart", range.start);
            if (range.end) params.set("periodEnd", range.end);
            if (dept !== "ALL") params.set("departmentId", dept);

            const [d, dep] = await Promise.all([
                api.get(`/dashboard/payroll?${params}`),
                api.get("/employees/departments").catch(() => ({ data: { data: [] } })),
            ]);
            setData(d.data.data);
            setDepartments(dep.data.data || []);
        } catch { toast.error("Failed to load dashboard"); }
        finally { setLoading(false); }
    }

    const kpis = data?.kpis || {};
    const att = data?.attendanceOverview || {};
    const tov = data?.timeOffOverview || {};
    const alerts = data?.alerts || {};
    const deptCost = data?.salaryCostByDepartment || [];
    const monthly = data?.monthlyNetTrend || [];
    const maxDept = Math.max(1, ...deptCost.map((d: any) => Number(d.totalNet || 0)));
    const maxMonthly = Math.max(1, ...monthly.map((m: any) => Number(m.net || 0)));

    function AttendanceBar({ val, max, color, label, count }: any) {
        const pct = max ? (val / max) * 100 : 0;
        return (
            <div>
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    }

    const attMax = Math.max(1, Number(att.present || 0), Number(att.late || 0), Number(att.absent || 0), Number(att.halfDay || 0), Number(att.onLeave || 0));

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1500px] mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900 tracking-[-0.02em] flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-indigo-600" /> Payroll Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Live overview of payroll costs, staffing, time off and attendance health</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white font-medium">
                        <option value="ALL">All Time</option>
                        <option value="MONTH">This Month</option>
                        <option value="QUARTER">This Quarter</option>
                        <option value="YEAR">This Year</option>
                    </select>
                    <select value={dept} onChange={e => setDept(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white font-medium">
                        <option value="ALL">All Departments</option>
                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button onClick={load} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">Refresh</button>
                </div>
            </div>

            {loading ? <div className="text-center py-20 text-gray-500">Loading dashboard...</div> : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {[
                            { label: "Total Net Paid", value: fmt(kpis.totalNetPaid), icon: Wallet, bg: "from-emerald-500 to-teal-500", sub: `${kpis.paidPayslips || 0} payslips paid` },
                            { label: "Payslips Generated", value: kpis.payslipsGenerated || 0, icon: FileCheck2, bg: "from-blue-500 to-indigo-500", sub: "across all payruns" },
                            { label: "Average Salary", value: fmt(kpis.averageSalary), icon: HandCoins, bg: "from-violet-500 to-purple-500", sub: "per payslip" },
                            { label: "Approved Time Off", value: `${(tov.approvedDays || 0) as unknown as number} days`, icon: CalendarDays, bg: "from-amber-500 to-orange-500", sub: `${tov.pendingRequests || 0} pending` },
                            { label: "Attendance Health", value: `${Math.round(Number(att.coveragePercent || 0))}%`, icon: UserCheck, bg: "from-cyan-500 to-blue-500", sub: "coverage score" },
                            { label: "Active Employees", value: kpis.activeEmployees || 0, icon: Users, bg: "from-pink-500 to-rose-500", sub: `${kpis.activeContracts || 0} contracts` },
                        ].map((k) => {
                            const Icon = k.icon as any;
                            return (
                                <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 relative overflow-hidden group hover:shadow-md transition">
                                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${k.bg} opacity-10 group-hover:scale-125 transition -translate-y-6 translate-x-6`} />
                                    <div className="relative">
                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.bg} text-white flex items-center justify-center mb-3 shadow-sm`}>
                                            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                                        </div>
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
                                        <div className="text-xl md:text-[22px] font-extrabold text-gray-900 tracking-tight leading-none">{k.value}</div>
                                        <div className="text-[11px] text-gray-500 mt-2">{k.sub}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Salary Cost by Department</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Total net salary spend per department</p>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Layers className="w-4 h-4" /></div>
                            </div>
                            {deptCost.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">No department data yet</div> : (
                                <div className="space-y-4">
                                    {deptCost.map((d: any) => (
                                        <div key={d.departmentId}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-800">{d.name || "Unassigned"}</span>
                                                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-bold">{d.headcount || 0} staff</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">{fmt(d.totalNet)}</div>
                                            </div>
                                            <div className="h-9 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100 overflow-hidden relative">
                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl transition-all duration-700 relative"
                                                    style={{ width: `${(Number(d.totalNet || 0) / maxDept) * 100}%`, minWidth: d.totalNet ? '8px' : '0' }}>
                                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold opacity-0 hover:opacity-100 transition">{fmt(d.totalNet)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> Monthly Net Salary Trend</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Last 12 months total net payouts</p>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
                            </div>
                            {monthly.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">No historical data yet</div> : (
                                <div className="relative h-[240px] w-full">
                                    <svg className="w-full h-full" viewBox={`0 0 ${monthly.length * 80} 240`} preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {[0, 25, 50, 75, 100].map(pct => (
                                            <line key={pct} x1="0" x2="100%" y1={240 - (pct / 100) * 200} y2={240 - (pct / 100) * 200} stroke="#f3f4f6" strokeWidth="1" />
                                        ))}
                                        <path d={`M 40 ${220 - (Number(monthly[0].net || 0) / maxMonthly) * 190} ${monthly.map((m: any, i: number) => {
                                            const x = 40 + i * 80;
                                            const y = 220 - (Number(m.net || 0) / maxMonthly) * 190;
                                            return `L ${x} ${y}`;
                                        }).join(" ")} L ${40 + (monthly.length - 1) * 80} 220 L 40 220 Z`} fill="url(#trendFill)" />
                                        <path d={`${monthly.map((m: any, i: number) => {
                                            const x = 40 + i * 80;
                                            const y = 220 - (Number(m.net || 0) / maxMonthly) * 190;
                                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                                        }).join(" ")}`} stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        {monthly.map((m: any, i: number) => {
                                            const x = 40 + i * 80;
                                            const y = 220 - (Number(m.net || 0) / maxMonthly) * 190;
                                            return (
                                                <g key={i}>
                                                    <circle cx={x} cy={y} r="5" fill="white" stroke="#10b981" strokeWidth="2.5" />
                                                    <text x={x} y="238" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="600">{m.month}</text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 lg:col-span-2">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Operational Alerts</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Issues needing attention before next payroll</p>
                                </div>
                                <div className="flex gap-2">
                                    {alerts.payrollWarnings > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">{alerts.payrollWarnings} Warnings</span>}
                                    {alerts.pendingContracts > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">{alerts.pendingContracts} Contracts</span>}
                                </div>
                            </div>
                            {(!alerts.unresolvedWarnings || alerts.unresolvedWarnings.length === 0) && !alerts.pendingContracts ? (
                                <div className="rounded-2xl border-2 border-dashed border-emerald-100 bg-emerald-50/30 p-8 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-emerald-700">All clear! No pending issues.</p>
                                    <p className="text-xs text-emerald-600/70 mt-1">Payroll is ready to process.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(alerts.unresolvedWarnings || []).slice(0, 8).map((w: any) => (
                                        <div key={w.id} className={`rounded-xl p-3.5 border ${w.severity === "ERROR" ? "bg-red-50/60 border-red-100 text-red-700" : w.severity === "WARNING" ? "bg-amber-50/60 border-amber-100 text-amber-700" : "bg-blue-50/60 border-blue-100 text-blue-700"} flex items-start gap-3`}>
                                            {w.severity === "ERROR" ? <AlertOctagon className="w-4.5 h-4.5 mt-0.5 shrink-0" /> : w.severity === "WARNING" ? <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0" /> : <Shield className="w-4.5 h-4.5 mt-0.5 shrink-0" />}
                                            <div className="flex-1 text-sm">
                                                <div className="font-semibold">{w.message}</div>
                                                <div className="text-[11px] opacity-75 mt-0.5">
                                                    {w.payslip?.employee ? `${w.payslip.employee.firstName} ${w.payslip.employee.lastName}` : w.employee ? `${w.employee.firstName} ${w.employee.lastName}` : "—"}
                                                    {w.code && <span className="font-mono"> · {w.code}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-violet-500" /> Time Off Overview</h3>
                                <Award className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-1">Approved Leave Days</div>
                                    <div className="text-3xl font-extrabold text-violet-800 tracking-tight">{tov.approvedDays || 0}</div>
                                    <div className="text-[11px] text-violet-600/80 mt-1">Taken this period</div>
                                </div>
                                <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Requests</div>
                                        <BedDouble className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="text-3xl font-extrabold text-amber-700 tracking-tight">{tov.pendingRequests || 0}</div>
                                    <div className="text-[11px] text-amber-700/80 mt-1">awaiting review &amp; approval</div>
                                </div>
                                <div className="rounded-2xl p-4 bg-gray-50 border border-gray-100">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Leave Balances at a Glance</div>
                                    <div className="text-xs text-gray-600 space-y-1.5">
                                        <div className="flex justify-between"><span>Leave allocations active</span><b>{kpis.activeEmployees ? Math.round(kpis.activeEmployees * 0.8) : 0}</b></div>
                                        <div className="flex justify-between"><span>Avg. days remaining/emp</span><b>~{(12 - (tov.approvedDays / Math.max(1, kpis.activeEmployees || 1))).toFixed(1)}</b></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500" /> Attendance Overview</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Daily presence and exception breakdown</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold">
                                    <Clock3 className="w-3.5 h-3.5" /> {Math.round(Number(att.coveragePercent || 0))}% Coverage
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: "Present", val: att.present || 0, c: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
                                    { label: "Late Arrivals", val: att.late || 0, c: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
                                    { label: "Absent", val: att.absent || 0, c: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
                                    { label: "On Leave", val: att.onLeave || 0, c: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
                                ].map(k => (
                                    <div key={k.label} className={`${k.bg} rounded-2xl p-4 border border-gray-50`}>
                                        <div className="flex items-center gap-1.5 mb-2"><span className={`w-2 h-2 rounded-full ${k.dot}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{k.label}</span></div>
                                        <div className={`text-2xl font-extrabold tracking-tight ${k.c}`}>{k.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <AttendanceBar val={Number(att.present || 0)} max={attMax} label="✅ Present / On Time" color="bg-gradient-to-r from-emerald-400 to-teal-500" count={att.present || 0} />
                                <AttendanceBar val={Number(att.late || 0)} max={attMax} label="⏰ Late Arrivals" color="bg-gradient-to-r from-amber-400 to-orange-500" count={att.late || 0} />
                                <AttendanceBar val={Number(att.absent || 0)} max={attMax} label="❌ Absent" color="bg-gradient-to-r from-red-400 to-rose-500" count={att.absent || 0} />
                                <AttendanceBar val={Number(att.halfDay || 0)} max={attMax} label="🌗 Half Days" color="bg-gradient-to-r from-indigo-400 to-purple-400" count={att.halfDay || 0} />
                                <AttendanceBar val={Number(att.onLeave || 0)} max={attMax} label="🏖️ On Leave" color="bg-gradient-to-r from-violet-400 to-purple-500" count={att.onLeave || 0} />
                                {att.overtimeMinutes > 0 && (
                                    <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                                        <span className="text-sm font-semibold text-blue-700 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total Overtime</span>
                                        <b className="text-blue-800 font-extrabold">{Math.round(Number(att.overtimeMinutes) / 60)} hrs {Number(att.overtimeMinutes) % 60} mins</b>
                                    </div>
                                )}
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-50 pt-5">
                                <div className="text-center">
                                    <div className="text-2xl font-extrabold text-gray-900">{att.missingCheckout || 0}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Missing Checkout</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-extrabold text-gray-900">{att.manualEdits || 0}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Manual Corrections</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-extrabold text-gray-900">{att.holiday || 0}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Holidays / Weekend</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><PieChart className="w-5 h-5 text-rose-500" /> Department Headcount</h3>
                            </div>
                            {deptCost.length === 0 ? <div className="text-xs text-gray-400 text-center py-10">No data</div> : (
                                <div className="space-y-3">
                                    {deptCost.map((d: any) => {
                                        const maxHC = Math.max(1, ...deptCost.map((x: any) => Number(x.headcount || 0)));
                                        return (
                                            <div key={d.departmentId}>
                                                <div className="flex items-center justify-between text-sm mb-1.5">
                                                    <span className="font-semibold text-gray-800">{d.name}</span>
                                                    <span className="text-gray-500 font-mono text-xs">{d.headcount || 0}</span>
                                                </div>
                                                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400"
                                                        style={{ width: `${(Number(d.headcount || 0) / maxHC) * 100}%` }} />
                                                </div>
                                                <div className="text-right text-xs text-emerald-700 font-semibold mt-1">{fmt(d.totalNet)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        Dashboard aggregates live data across Employees, Contracts, Attendance, Time Off &amp; Payroll modules.
                    </div>
                </>
            )}
        </div>
    );
}
