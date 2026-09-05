import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Filter,
    Briefcase,
    Info,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface SalaryRule {
    id: string;
    name: string;
    code: string;
    category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'NET';
    computationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
    inputSource: string;
    fixedAmount: number | null;
    percentage: number | null;
    formula: string | null;
    isActive: boolean;
    description?: string | null;
    structures?: any[];
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    BASIC: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ALLOWANCE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    DEDUCTION: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    GROSS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    NET: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    EMPLOYER_CONTRIBUTION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const COMPUTATION_LABELS: Record<string, string> = {
    FIXED: 'Fixed Amount',
    PERCENTAGE: 'Percentage (%)',
    FORMULA: 'Custom Formula',
};

const INPUT_SOURCES = [
    'NONE',
    'BASE_SALARY',
    'BASIC',
    'GROSS',
    'NET',
    'OVERTIME_HOURS',
    'LATE_HOURS',
    'ABSENT_DAYS',
    'WORKED_HOURS',
    'EXPECTED_HOURS',
    'HOLIDAY_HOURS',
    'PAID_LEAVE_DAYS',
    'UNPAID_LEAVE_DAYS',
    'WORKED_DAYS',
    'EXPECTED_DAYS',
];

export default function SalaryRules() {
    const { hasRole } = useAuth();
    const canDelete = hasRole(['ADMIN', 'HR_PAYROLL_MANAGER']);
    const [rules, setRules] = useState<SalaryRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<SalaryRule | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        code: '',
        category: 'ALLOWANCE' as SalaryRule['category'],
        computationType: 'FIXED' as SalaryRule['computationType'],
        inputSource: 'NONE',
        fixedAmount: '',
        percentage: '',
        formula: '',
        isActive: true,
        description: '',
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        try {
            const res = await api.get('/salary/rules?includeInactive=true');
            setRules(res.data.data || []);
        } catch (err: any) {
            toast.error('Failed to load salary rules');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (rule?: SalaryRule) => {
        if (rule) {
            setEditingRule(rule);
            setForm({
                name: rule.name,
                code: rule.code,
                category: rule.category,
                computationType: rule.computationType,
                inputSource: rule.inputSource || 'NONE',
                fixedAmount: rule.fixedAmount != null ? String(rule.fixedAmount) : '',
                percentage: rule.percentage != null ? String(rule.percentage) : '',
                formula: rule.formula || '',
                isActive: rule.isActive,
                description: rule.description || '',
            });
        } else {
            setEditingRule(null);
            setForm({
                name: '',
                code: '',
                category: 'ALLOWANCE',
                computationType: 'FIXED',
                inputSource: 'NONE',
                fixedAmount: '',
                percentage: '',
                formula: '',
                isActive: true,
                description: '',
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.code) {
            toast.error('Rule name and code are required');
            return;
        }

        const payload: any = {
            name: form.name,
            code: form.code.toUpperCase().trim(),
            category: form.category,
            computationType: form.computationType,
            inputSource: form.inputSource,
            fixedAmount: form.computationType === 'FIXED' ? (form.fixedAmount ? Number(form.fixedAmount) : 0) : null,
            percentage: form.computationType === 'PERCENTAGE' ? (form.percentage ? Number(form.percentage) : 0) : null,
            formula: form.computationType === 'FORMULA' ? form.formula : null,
            isActive: form.isActive,
            description: form.description || undefined,
        };

        setSubmitting(true);
        try {
            if (editingRule) {
                await api.put(`/salary/rules/${editingRule.id}`, payload);
                toast.success('Salary rule updated successfully!');
            } else {
                await api.post('/salary/rules', payload);
                toast.success('Salary rule created successfully!');
            }
            setShowModal(false);
            loadRules();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save salary rule');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete rule "${name}"?`)) return;

        try {
            await api.delete(`/salary/rules/${id}`);
            toast.success(`Salary rule "${name}" deleted`);
            loadRules();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete salary rule');
        }
    };

    const filteredRules = rules.filter((r) => {
        if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <Briefcase className="w-7 h-7 text-blue-600" />
                        Salary Rules Manager
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Author component calculation rules (Fixed, Percentage, and Custom Formulas)
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> New Salary Rule
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search rules by name or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="BASIC">BASIC</option>
                        <option value="ALLOWANCE">ALLOWANCE</option>
                        <option value="GROSS">GROSS</option>
                        <option value="DEDUCTION">DEDUCTION</option>
                        <option value="EMPLOYER_CONTRIBUTION">EMPLOYER_CONTRIBUTION</option>
                        <option value="NET">NET</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3.5">Rule Code & Name</th>
                                <th className="px-6 py-3.5">Category</th>
                                <th className="px-6 py-3.5">Computation Type</th>
                                <th className="px-6 py-3.5">Input Source</th>
                                <th className="px-6 py-3.5">Value / Formula</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        Loading salary rules...
                                    </td>
                                </tr>
                            ) : filteredRules.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        No salary rules found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredRules.map((rule) => {
                                    const catStyle = CATEGORY_STYLES[rule.category] || CATEGORY_STYLES.ALLOWANCE;
                                    return (
                                        <tr key={rule.id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                                        {rule.code}
                                                    </span>
                                                    {rule.name}
                                                </div>
                                                {rule.description && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{rule.description}</p>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                                    {rule.category}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 font-medium text-gray-700">
                                                {COMPUTATION_LABELS[rule.computationType] || rule.computationType}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                                {rule.inputSource || 'NONE'}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-800">
                                                {rule.computationType === 'FIXED' && `₹${Number(rule.fixedAmount || 0).toLocaleString('en-IN')}`}
                                                {rule.computationType === 'PERCENTAGE' && `${rule.percentage}% of ${rule.inputSource}`}
                                                {rule.computationType === 'FORMULA' && (
                                                    <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono text-[11px] border border-slate-200">
                                                        {rule.formula || '-'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {rule.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleOpenModal(rule)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        title="Edit Rule"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(rule.id, rule.name)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                            title="Delete Rule"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Authoring Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col">
                        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                            <h2 className="font-bold text-base flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                                {editingRule ? `Edit Salary Rule: ${editingRule.code}` : 'Create New Salary Rule'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Rule Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. House Rent Allowance"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Rule Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. HRA"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                                    >
                                        <option value="BASIC">BASIC (Base Salary Component)</option>
                                        <option value="ALLOWANCE">ALLOWANCE (Additions)</option>
                                        <option value="GROSS">GROSS (Total Earnings)</option>
                                        <option value="DEDUCTION">DEDUCTION (Deductions/Taxes)</option>
                                        <option value="EMPLOYER_CONTRIBUTION">EMPLOYER_CONTRIBUTION</option>
                                        <option value="NET">NET (Take Home Pay)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Computation Type *
                                    </label>
                                    <select
                                        value={form.computationType}
                                        onChange={(e) => setForm({ ...form, computationType: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                                    >
                                        <option value="FIXED">FIXED (Fixed Rupee Amount)</option>
                                        <option value="PERCENTAGE">PERCENTAGE (% of Input Source)</option>
                                        <option value="FORMULA">FORMULA (Custom Math Expression)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Input Source Dropdown */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Input Data Source {form.computationType === 'PERCENTAGE' && '*'}
                                </label>
                                <select
                                    value={form.inputSource}
                                    onChange={(e) => setForm({ ...form, inputSource: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono bg-white outline-none"
                                >
                                    {INPUT_SOURCES.map((src) => (
                                        <option key={src} value={src}>
                                            {src}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic Value Inputs */}
                            {form.computationType === 'FIXED' && (
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Fixed Amount (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 2500"
                                        value={form.fixedAmount}
                                        onChange={(e) => setForm({ ...form, fixedAmount: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                            )}

                            {form.computationType === 'PERCENTAGE' && (
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Percentage (%) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 40 (for 40%)"
                                        value={form.percentage}
                                        onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                            )}

                            {form.computationType === 'FORMULA' && (
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Custom Formula Expression *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. OVERTIME_HOURS * HOURLY_RATE * 1.5"
                                        value={form.formula}
                                        onChange={(e) => setForm({ ...form, formula: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Available variables: BASE_SALARY, BASIC, GROSS, OVERTIME_HOURS, LATE_HOURS, ABSENT_DAYS, WORKED_HOURS, UNPAID_LEAVE_DAYS, HOURLY_RATE, DAILY_RATE
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Description / Explanation Notes
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional description of this calculation rule..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActiveToggle"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600"
                                />
                                <label htmlFor="isActiveToggle" className="font-semibold text-gray-700 cursor-pointer">
                                    Active Rule (available for structure composition)
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
