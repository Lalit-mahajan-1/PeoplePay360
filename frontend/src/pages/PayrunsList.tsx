import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Wallet,
    Plus,
    Search,
    Filter,
    Calendar,
    Layers,
    ArrowRight,
    AlertTriangle,
    Building2,
} from 'lucide-react';
import PayrunWizard from '../components/PayrunWizard';

const STATUS_BADGES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    DRAFT: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Draft' },
    COMPUTED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Computed' },
    VALIDATED: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Validated' },
    PAID: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
    CANCELLED: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Cancelled' },
};

const fmt = (n: number | null | undefined) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function PayrunsList() {
    const navigate = useNavigate();
    const [payruns, setPayruns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        loadPayruns();
    }, []);

    const loadPayruns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payroll/payruns');
            setPayruns(res.data.data || []);
        } catch (err: any) {
            toast.error('Failed to load payruns');
        } finally {
            setLoading(false);
        }
    };

    const handleWizardSuccess = (payrunId: string) => {
        setShowWizard(false);
        navigate(`/payroll/payruns/${payrunId}`);
    };

    const filteredPayruns = payruns.filter((p) => {
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.salaryStructure?.name?.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <Wallet className="w-7 h-7 text-blue-600" />
                        Payruns Management Center
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Batch salary generation, validation, and payment execution
                    </p>
                </div>

                <button
                    onClick={() => setShowWizard(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> New Pay Run
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search payruns by batch name or structure..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="COMPUTED">Computed</option>
                        <option value="VALIDATED">Validated</option>
                        <option value="PAID">Paid</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                    Showing {filteredPayruns.length} of {payruns.length} payruns
                </div>
            </div>

            {/* Payruns List Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3.5">Pay Run Batch</th>
                                <th className="px-6 py-3.5">Period Dates</th>
                                <th className="px-6 py-3.5">Salary Structure</th>
                                <th className="px-6 py-3.5 text-right">Employees</th>
                                <th className="px-6 py-3.5 text-right">Payslips</th>
                                <th className="px-6 py-3.5 text-right">Total Net</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        Loading payruns...
                                    </td>
                                </tr>
                            ) : filteredPayruns.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No payruns match current filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayruns.map((p) => {
                                    const badge = STATUS_BADGES[p.status] || STATUS_BADGES.DRAFT;
                                    const warningCount = p._count?.warnings || p.warnings?.length || 0;

                                    return (
                                        <tr
                                            key={p.id}
                                            onClick={() => navigate(`/payroll/payruns/${p.id}`)}
                                            className="hover:bg-blue-50/30 transition cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                                                <div className="text-[11px] text-gray-400">
                                                    Created {new Date(p.createdAt).toLocaleDateString('en-IN')}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {p.periodStart?.slice(0, 10)}
                                                </div>
                                                <div className="text-[11px] text-gray-500 ml-5">to {p.periodEnd?.slice(0, 10)}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                                                    {p.salaryStructure?.name || 'Default Structure'}
                                                </div>
                                                {p.department?.name && (
                                                    <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Building2 className="w-3 h-3" />
                                                        {p.department.name}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right font-bold text-gray-900 text-sm">
                                                {p.employeeCount || p._count?.employees || 0}
                                            </td>

                                            <td className="px-6 py-4 text-right font-bold text-gray-900 text-sm">
                                                {p.payslipCount || p._count?.payslips || 0}
                                            </td>

                                            <td className="px-6 py-4 text-right font-bold text-emerald-700 text-sm">
                                                {fmt(p.totalNet)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                        {badge.label}
                                                    </span>
                                                    {warningCount > 0 && (
                                                        <span
                                                            className="p-1 rounded bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center gap-0.5"
                                                            title={`${warningCount} system warnings`}
                                                        >
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {warningCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/payroll/payruns/${p.id}`);
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    Manage <ArrowRight className="w-3 h-3" />
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

            {/* Creation Wizard Modal */}
            {showWizard && (
                <PayrunWizard
                    onClose={() => setShowWizard(false)}
                    onSuccess={handleWizardSuccess}
                />
            )}
        </div>
    );
}
