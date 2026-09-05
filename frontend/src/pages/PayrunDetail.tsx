import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Wallet,
    ArrowLeft,
    Play,
    CheckCircle2,
    Banknote,
    Mail,
    AlertTriangle,
    Search,
    Building2,
    Calendar,
    Layers,
    User,
} from 'lucide-react';
import WarningPanel from '../components/WarningPanel';
import PayslipBreakdown from '../components/PayslipBreakdown';

const STATUS_BADGES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    DRAFT: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Draft' },
    COMPUTED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Computed' },
    VALIDATED: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Validated' },
    PAID: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
    CANCELLED: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Cancelled' },
};

const fmt = (n: number | null | undefined) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function PayrunDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [payrun, setPayrun] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Modal state for viewing single payslip
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

    useEffect(() => {
        if (id) loadPayrun();
    }, [id]);

    const loadPayrun = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/payroll/payruns/${id}`);
            setPayrun(res.data.data || null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load payrun details');
        } finally {
            setLoading(false);
        }
    };

    const handleCompute = async () => {
        setActionLoading(true);
        try {
            await api.post(`/payroll/payruns/${id}/compute`);
            toast.success('Rule engine executed! Payslips generated with explanations.');
            loadPayrun();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to compute payrun');
        } finally {
            setActionLoading(false);
        }
    };

    const handleValidate = async () => {
        setActionLoading(true);
        try {
            await api.post(`/payroll/payruns/${id}/validate`);
            toast.success('Payrun validated successfully!');
            loadPayrun();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Validation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!window.confirm('Are you sure you want to mark this payrun as PAID?')) return;

        setActionLoading(true);
        try {
            await api.post(`/payroll/payruns/${id}/paid`);
            toast.success('Payrun marked as PAID!');
            loadPayrun();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark payrun as paid');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendPayslips = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/payroll/payruns/${id}/send`);
            toast.success(`Payslips dispatched! Sent: ${res.data.data?.sent || 0}`);
            loadPayrun();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send payslips');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-sm text-gray-500">Loading payrun details...</div>;
    }

    if (!payrun) {
        return (
            <div className="p-12 text-center text-sm text-gray-500">
                Payrun not found.{' '}
                <button onClick={() => navigate('/payroll')} className="text-blue-600 underline">
                    Back to Payruns
                </button>
            </div>
        );
    }

    const badge = STATUS_BADGES[payrun.status] || STATUS_BADGES.DRAFT;
    const payslips: any[] = payrun.payslips || [];
    const warnings: any[] = payrun.warnings || [];

    const hasErrorWarnings = warnings.some((w: any) => w.severity === 'ERROR' && !w.isResolved);

    const filteredPayslips = payslips.filter((ps) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const empName = `${ps.employee?.firstName} ${ps.employee?.lastName}`.toLowerCase();
        const code = (ps.employee?.employeeCode || '').toLowerCase();
        return empName.includes(q) || code.includes(q);
    });

    const totalNet = payslips.reduce((sum, p) => sum + Number(p.netAmount || 0), 0);
    const totalGross = payslips.reduce((sum, p) => sum + Number(p.grossAmount || 0), 0);

    return (
        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
            {/* Navigation & Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/payroll')}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{payrun.name}</h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>Period: {payrun.periodStart?.slice(0, 10)} to {payrun.periodEnd?.slice(0, 10)}</span>
                        <span>•</span>
                        <span>Structure: {payrun.salaryStructure?.name}</span>
                        {payrun.department && (
                            <>
                                <span>•</span>
                                <span>Dept: {payrun.department.name}</span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Net Payout</span>
                        <span className="text-xl font-extrabold text-emerald-700 font-mono">{fmt(totalNet)}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Earnings</span>
                        <span className="text-base font-bold text-gray-900 font-mono">{fmt(totalGross)}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payslips Count</span>
                        <span className="text-base font-bold text-gray-900">{payslips.length} Employees</span>
                    </div>
                </div>

                {/* Conditional Action Buttons */}
                <div className="flex items-center gap-3">
                    {payrun.status === 'DRAFT' && (
                        <button
                            onClick={handleCompute}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                        >
                            <Play className="w-4 h-4" />
                            {actionLoading ? 'Executing Engine...' : 'Compute Salary (Run Rule Engine)'}
                        </button>
                    )}

                    {payrun.status === 'COMPUTED' && (
                        <>
                            <button
                                onClick={handleCompute}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Re-Compute
                            </button>
                            <button
                                onClick={handleValidate}
                                disabled={actionLoading || hasErrorWarnings}
                                title={hasErrorWarnings ? 'Blocked by unresolved ERROR warnings' : 'Validate Payrun'}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {actionLoading ? 'Validating...' : 'Validate Payrun'}
                            </button>
                        </>
                    )}

                    {payrun.status === 'VALIDATED' && (
                        <>
                            <button
                                onClick={handleMarkPaid}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                            >
                                <Banknote className="w-4 h-4" />
                                {actionLoading ? 'Processing...' : 'Mark as PAID'}
                            </button>
                            <button
                                onClick={handleSendPayslips}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                <Mail className="w-4 h-4" /> Dispatch Payslip Emails
                            </button>
                        </>
                    )}

                    {payrun.status === 'PAID' && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Paid & Finalized
                            </span>
                            <button
                                onClick={handleSendPayslips}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                <Mail className="w-4 h-4" /> Send Payslip Emails
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Warnings Section */}
            {warnings.length > 0 && (
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <WarningPanel warnings={warnings} title="Payrun Audit & Calculation Warnings" />
                </div>
            )}

            {/* Payslips Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter employee payslips..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        Showing {filteredPayslips.length} of {payslips.length} payslips
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3.5">Employee Name & Code</th>
                                <th className="px-6 py-3.5 text-center">Worked Days</th>
                                <th className="px-6 py-3.5 text-right">Basic</th>
                                <th className="px-6 py-3.5 text-right">Allowances</th>
                                <th className="px-6 py-3.5 text-right">Deductions</th>
                                <th className="px-6 py-3.5 text-right">Gross Total</th>
                                <th className="px-6 py-3.5 text-right">Net Payable</th>
                                <th className="px-6 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPayslips.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No payslips computed yet. Click "Compute Salary" to run the rule engine.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayslips.map((ps) => {
                                    const empObj = ps.employee || {};
                                    return (
                                        <tr
                                            key={ps.id}
                                            onClick={() => setSelectedPayslip(ps)}
                                            className="hover:bg-blue-50/40 transition cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {empObj.firstName} {empObj.lastName}
                                                </div>
                                                <div className="text-[11px] font-mono text-gray-400">{empObj.employeeCode}</div>
                                            </td>

                                            <td className="px-6 py-4 text-center font-bold text-gray-700">
                                                {ps.workedDays || 0} Days
                                            </td>

                                            <td className="px-6 py-4 text-right font-mono font-medium text-gray-800">
                                                {fmt(ps.basicAmount)}
                                            </td>

                                            <td className="px-6 py-4 text-right font-mono font-medium text-emerald-700">
                                                +{fmt(ps.allowanceAmount)}
                                            </td>

                                            <td className="px-6 py-4 text-right font-mono font-medium text-red-600">
                                                -{fmt(ps.deductionAmount)}
                                            </td>

                                            <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                                {fmt(ps.grossAmount)}
                                            </td>

                                            <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 text-sm">
                                                {fmt(ps.netAmount)}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPayslip(ps);
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                                                >
                                                    Explain & View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payslip Detail Modal */}
            {selectedPayslip && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <PayslipBreakdown
                        payslip={selectedPayslip}
                        onClose={() => setSelectedPayslip(null)}
                    />
                </div>
            )}
        </div>
    );
}
