import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Wallet, Calendar, Printer, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import PayslipBreakdown from '../components/PayslipBreakdown';

const fmt = (n: number | null | undefined) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function MyPayslips() {
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

    useEffect(() => {
        loadMyPayslips();
    }, []);

    const loadMyPayslips = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payroll/payslips/my');
            setPayslips(res.data.data || []);
        } catch (err: any) {
            toast.error('Failed to load your payslips');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                    <Wallet className="w-7 h-7 text-blue-600" />
                    My Salary Statements & Payslips
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Self-service access to your monthly payslips with transparent calculation breakdowns
                </p>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3.5">Pay Period</th>
                                <th className="px-6 py-3.5">Payrun Batch</th>
                                <th className="px-6 py-3.5 text-center">Worked Days</th>
                                <th className="px-6 py-3.5 text-right">Gross Earnings</th>
                                <th className="px-6 py-3.5 text-right">Deductions</th>
                                <th className="px-6 py-3.5 text-right">Net Take-Home</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        Loading your payslips...
                                    </td>
                                </tr>
                            ) : payslips.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No payslips issued yet.
                                    </td>
                                </tr>
                            ) : (
                                payslips.map((ps) => (
                                    <tr
                                        key={ps.id}
                                        onClick={() => setSelectedPayslip(ps)}
                                        className="hover:bg-blue-50/40 transition cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {ps.periodStart?.slice(0, 10)} to {ps.periodEnd?.slice(0, 10)}
                                        </td>

                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {ps.payrun?.name || 'Monthly Payroll'}
                                        </td>

                                        <td className="px-6 py-4 text-center font-bold text-gray-700">
                                            {ps.workedDays || 0} Days
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono text-gray-900">
                                            {fmt(ps.grossAmount)}
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono text-red-600">
                                            -{fmt(ps.deductionAmount)}
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 text-sm">
                                            {fmt(ps.netAmount)}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                {ps.paymentStatus === 'PAID' ? 'Paid' : ps.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPayslip(ps);
                                                }}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                View Breakdown <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
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
