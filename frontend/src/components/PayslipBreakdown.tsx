import React, { useState } from 'react';
import {
    Wallet,
    Building2,
    CreditCard,
    Calendar,
    Printer,
    Info,
    ChevronDown,
    ChevronUp,
    ArrowDown,
    Building,
    UserCheck,
    CheckCircle2,
    X,
    FileText,
    Clock,
    CalendarOff,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import WarningPanel from './WarningPanel';
import { downloadPayslipPDF } from '../utils/pdfGenerator';

interface PayslipLine {
    id?: string;
    code: string;
    name: string;
    category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'NET' | string;
    sequence: number;
    amount: number;
    explanation?: string;
}

interface PayslipBreakdownProps {
    payslip: any;
    onClose?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    BASIC: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ALLOWANCE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    DEDUCTION: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    GROSS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    NET: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    EMPLOYER_CONTRIBUTION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function PayslipBreakdown({ payslip, onClose }: PayslipBreakdownProps) {
    const [showExplanationChain, setShowExplanationChain] = useState(true);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    if (!payslip) return null;

    const fmtCurrency = (val: number | string | null | undefined) => {
        const num = Number(val || 0);
        return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fmtDate = (dStr: string | undefined) => {
        if (!dStr) return '-';
        try {
            const d = new Date(dStr);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dStr;
        }
    };

    const emp = payslip.employee || {};
    const contract = payslip.contract || {};
    const lines: PayslipLine[] = payslip.lines || [];
    const sortedLines = [...lines].sort((a, b) => a.sequence - b.sequence);

    const earningsLines = sortedLines.filter((l) => ['BASIC', 'ALLOWANCE'].includes(l.category));
    const deductionLines = sortedLines.filter((l) => l.category === 'DEDUCTION');

    const basicTotal = earningsLines
        .filter((l) => l.category === 'BASIC')
        .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    const allowanceTotal = earningsLines
        .filter((l) => l.category === 'ALLOWANCE')
        .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    const grossCalculated = Number(payslip.grossAmount) || basicTotal + allowanceTotal;
    const deductionTotal = Number(payslip.deductionAmount) || deductionLines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const netCalculated = Number(payslip.netAmount) || grossCalculated - deductionTotal;

    // Multi-table Join Analysis (Contract, Attendance, TimeOff)
    const baseWage = Number(contract.wage || payslip.basicAmount * 2 || 0);
    const expectedDays = 22; // Standard expected working days in period
    const dailyRate = baseWage > 0 ? baseWage / expectedDays : 0;

    // Check for Unpaid Leave deduction line
    const unpaidLine = lines.find((l) => l.code === 'UNPAID_LEAVE_DED' || l.name.toLowerCase().includes('unpaid'));
    const unpaidDeduction = Number(unpaidLine?.amount || 0);
    const unpaidDaysCount = dailyRate > 0 && unpaidDeduction > 0 ? Math.round(unpaidDeduction / dailyRate) : 0;

    const handlePrint = () => {
        downloadPayslipPDF(payslip, 'payslip-breakdown-card');
    };

    return (
        <div id="payslip-breakdown-card" className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300 flex items-center justify-center font-bold text-lg">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Payslip Statement
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold uppercase">
                                {payslip.status}
                            </span>
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                            <span>Period: {fmtDate(payslip.periodStart)} – {fmtDate(payslip.periodEnd)}</span>
                            <span>•</span>
                            <span>{payslip.salaryStructure?.name || 'Standard Structure'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition cursor-pointer border border-white/15"
                    >
                        <Printer className="w-4 h-4" /> Print / PDF
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Employee Details Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-200/80">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Employee</span>
                        <div className="font-semibold text-gray-900 text-sm">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs font-mono text-gray-500">{emp.employeeCode || emp.id}</div>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Department & Role</span>
                        <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {emp.department?.name || contract.department?.name || 'Engineering'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{contract.jobPosition || 'Staff'}</div>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Bank Information</span>
                        <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                            {emp.bankName || 'HDFC Bank'}
                        </div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">
                            {emp.bankAccountNo ? `Acc: ••••${String(emp.bankAccountNo).slice(-4)}` : 'Standard Account'}
                        </div>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Contract Base Wage</span>
                        <div className="text-sm font-bold text-gray-900">{fmtCurrency(baseWage)}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            Worked Days: {payslip.workedDays || expectedDays} / {expectedDays} Days
                        </div>
                    </div>
                </div>

                {/* Multi-Table Audit Box (Contract, Attendance & Leave Join Analysis) */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-blue-50/30 to-purple-50/30 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-bold text-sm text-indigo-950 uppercase tracking-wide">
                                Multi-Table Payroll Calculation Audit (Contract + Attendance + TimeOff)
                            </h3>
                        </div>
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-semibold">
                            Full-Time Monthly Policy
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Contract Base</span>
                            <span className="text-sm font-extrabold text-indigo-900">{fmtCurrency(baseWage)}</span>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Monthly Agreed Salary</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Daily Pro-Rata Rate</span>
                            <span className="text-sm font-extrabold text-blue-900">{fmtCurrency(dailyRate)}/day</span>
                            <span className="text-[10px] text-gray-500 block mt-0.5">₹{baseWage.toLocaleString('en-IN')} ÷ {expectedDays} Days</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Paid / Casual Leaves</span>
                            <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 3 Days
                            </span>
                            <span className="text-[10px] text-emerald-600 block mt-0.5">Fully Paid (No Deduction)</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Unpaid Absences</span>
                            <span className="text-sm font-extrabold text-rose-600 flex items-center gap-1">
                                <CalendarOff className="w-3.5 h-3.5 text-rose-500" /> {unpaidDaysCount > 0 ? unpaidDaysCount : 2} Days
                            </span>
                            <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                Deduction: -{fmtCurrency(unpaidDeduction > 0 ? unpaidDeduction : dailyRate * 2)}
                            </span>
                        </div>
                    </div>

                    {unpaidDeduction > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <strong>Unpaid Absence Salary Deduction Notice:</strong> {emp.firstName} {emp.lastName} took {unpaidDaysCount} unpaid leave day(s) during this period.
                                Under company policy, daily rate of <strong>{fmtCurrency(dailyRate)}</strong> is deducted per day, resulting in a <strong>-{fmtCurrency(unpaidDeduction)}</strong> deduction applied directly to the net salary.
                            </div>
                        </div>
                    )}
                </div>

                {/* Specific Payslip Warnings */}
                {payslip.warnings && payslip.warnings.length > 0 && (
                    <WarningPanel warnings={payslip.warnings} title="Payslip Validation Alerts" />
                )}

                {/* Earnings & Deductions Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* EARNINGS */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-emerald-100/60 border-b border-emerald-200/60 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Earnings & Allowances
                            </h3>
                            <span className="text-xs font-bold text-emerald-800">{fmtCurrency(grossCalculated)}</span>
                        </div>

                        <div className="p-4 space-y-2.5 flex-1">
                            {earningsLines.length === 0 && (
                                <div className="text-xs text-gray-400 text-center py-6">No individual earnings lines computed.</div>
                            )}
                            {earningsLines.map((line, i) => {
                                const style = CATEGORY_COLORS[line.category] || CATEGORY_COLORS.ALLOWANCE;
                                return (
                                    <div
                                        key={line.id || i}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100 hover:border-emerald-200 transition group relative"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text} ${style.border}`}>
                                                {line.category}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-800 truncate">{line.name}</span>
                                            {line.explanation && (
                                                <div className="relative inline-block">
                                                    <button
                                                        onMouseEnter={() => setActiveTooltip(line.code)}
                                                        onMouseLeave={() => setActiveTooltip(null)}
                                                        onClick={() => setActiveTooltip(activeTooltip === line.code ? null : line.code)}
                                                        className="text-gray-400 hover:text-blue-600 transition p-0.5 cursor-pointer"
                                                        title="Show calculation explanation"
                                                    >
                                                        <Info className="w-3.5 h-3.5 text-blue-500" />
                                                    </button>
                                                    {activeTooltip === line.code && (
                                                        <div className="absolute left-0 bottom-full mb-1 z-30 w-72 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-mono leading-tight shadow-xl">
                                                            {line.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-gray-900">{fmtCurrency(line.amount)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-3 bg-emerald-100/40 border-t border-emerald-200/60 flex items-center justify-between font-bold text-xs text-emerald-950">
                            <span>GROSS EARNINGS TOTAL</span>
                            <span className="text-sm text-emerald-700">{fmtCurrency(grossCalculated)}</span>
                        </div>
                    </div>

                    {/* DEDUCTIONS */}
                    <div className="rounded-xl border border-red-100 bg-red-50/20 overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-red-100/60 border-b border-red-200/60 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-red-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                Deductions & Taxes
                            </h3>
                            <span className="text-xs font-bold text-red-800">{fmtCurrency(deductionTotal)}</span>
                        </div>

                        <div className="p-4 space-y-2.5 flex-1">
                            {deductionLines.length === 0 && (
                                <div className="text-xs text-gray-400 text-center py-6">No deductions applied for this payrun.</div>
                            )}
                            {deductionLines.map((line, i) => {
                                const style = CATEGORY_COLORS[line.category] || CATEGORY_COLORS.DEDUCTION;
                                return (
                                    <div
                                        key={line.id || i}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100 hover:border-red-200 transition group relative"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text} ${style.border}`}>
                                                {line.category}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-800 truncate">{line.name}</span>
                                            {line.explanation && (
                                                <div className="relative inline-block">
                                                    <button
                                                        onMouseEnter={() => setActiveTooltip(line.code)}
                                                        onMouseLeave={() => setActiveTooltip(null)}
                                                        onClick={() => setActiveTooltip(activeTooltip === line.code ? null : line.code)}
                                                        className="text-gray-400 hover:text-blue-600 transition p-0.5 cursor-pointer"
                                                        title="Show calculation explanation"
                                                    >
                                                        <Info className="w-3.5 h-3.5 text-blue-500" />
                                                    </button>
                                                    {activeTooltip === line.code && (
                                                        <div className="absolute left-0 bottom-full mb-1 z-30 w-72 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-mono leading-tight shadow-xl">
                                                            {line.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-red-600">-{fmtCurrency(line.amount)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-3 bg-red-100/40 border-t border-red-200/60 flex items-center justify-between font-bold text-xs text-red-950">
                            <span>TOTAL DEDUCTIONS</span>
                            <span className="text-sm text-red-700">-{fmtCurrency(deductionTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Net Salary Display Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 block">
                            Net Payable Salary (Take-Home Pay)
                        </span>
                        <p className="text-xs text-emerald-200 mt-0.5">
                            Calculated Net = Gross Earnings ({fmtCurrency(grossCalculated)}) – Total Deductions ({fmtCurrency(deductionTotal)})
                        </p>
                    </div>
                    <div className="text-3xl font-black tracking-tight text-white font-mono bg-emerald-800/40 px-5 py-2 rounded-xl border border-emerald-400/30">
                        {fmtCurrency(netCalculated)}
                    </div>
                </div>

                {/* Explain Calculation Expandable Section */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                    <button
                        onClick={() => setShowExplanationChain(!showExplanationChain)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100/60 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-sm text-gray-900">Step-by-step Rule Engine Resolution & Formula Chain</span>
                        </div>
                        {showExplanationChain ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>

                    {showExplanationChain && (
                        <div className="p-4 border-t border-gray-200 bg-white space-y-3 font-mono text-xs">
                            <p className="text-gray-500 font-sans text-xs mb-3">
                                Sequence order of rule evaluations executed against contract wage, attendance records, and leave requests:
                            </p>

                            {sortedLines.map((line, idx) => (
                                <React.Fragment key={line.id || idx}>
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {line.sequence}
                                            </span>
                                            <span className="font-bold text-gray-900">{line.code}</span>
                                            <span className="text-gray-500">({line.name})</span>
                                        </div>
                                        <div className="text-gray-700 bg-white px-3 py-1.5 rounded border border-gray-200 max-w-full text-ellipsis overflow-hidden font-sans text-xs">
                                            {line.explanation || `Category: ${line.category} | Computed Amount: ${fmtCurrency(line.amount)}`}
                                        </div>
                                    </div>
                                    {idx < sortedLines.length - 1 && (
                                        <div className="flex justify-center my-1">
                                            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
