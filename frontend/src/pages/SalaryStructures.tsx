import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    Layers,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    ChevronUp,
    ChevronDown,
    Briefcase,
    FileText,
    ArrowRight,
} from 'lucide-react';

interface StructureRule {
    salaryRuleId: string;
    sequence: number;
    salaryRule?: any;
}

interface SalaryStructure {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isActive: boolean;
    rules: StructureRule[];
    contracts?: any[];
    _count?: {
        contracts: number;
        payruns: number;
    };
}

export default function SalaryStructures() {
    const { hasRole } = useAuth();
    const canManageStructure = hasRole(['ADMIN', 'HR_PAYROLL_MANAGER']);
    const [structures, setStructures] = useState<SalaryStructure[]>([]);
    const [availableRules, setAvailableRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Detail view state
    const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true,
        selectedRules: [] as { salaryRuleId: string; sequence: number }[],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [structRes, rulesRes] = await Promise.all([
                api.get('/salary/structures?includeInactive=true'),
                api.get('/salary/rules'),
            ]);
            setStructures(structRes.data.data || []);
            setAvailableRules(rulesRes.data.data || []);
        } catch (err: any) {
            toast.error('Failed to load salary structures');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (struct?: SalaryStructure) => {
        if (struct) {
            setEditingStructure(struct);
            const mappedRules = (struct.rules || []).map((r: any) => ({
                salaryRuleId: r.salaryRuleId || r.salaryRule?.id,
                sequence: r.sequence,
            }));
            setForm({
                name: struct.name,
                code: struct.code,
                description: struct.description || '',
                isActive: struct.isActive,
                selectedRules: mappedRules,
            });
        } else {
            setEditingStructure(null);
            // Default select available rules in order
            const defaultRules = availableRules.map((r, idx) => ({
                salaryRuleId: r.id,
                sequence: idx + 1,
            }));
            setForm({
                name: '',
                code: '',
                description: '',
                isActive: true,
                selectedRules: defaultRules,
            });
        }
        setShowModal(true);
    };

    const handleToggleRuleSelection = (ruleId: string) => {
        setForm((prev) => {
            const exists = prev.selectedRules.some((r) => r.salaryRuleId === ruleId);
            if (exists) {
                const updated = prev.selectedRules
                    .filter((r) => r.salaryRuleId !== ruleId)
                    .map((r, idx) => ({ ...r, sequence: idx + 1 }));
                return { ...prev, selectedRules: updated };
            } else {
                const newSeq = prev.selectedRules.length + 1;
                return {
                    ...prev,
                    selectedRules: [...prev.selectedRules, { salaryRuleId: ruleId, sequence: newSeq }],
                };
            }
        });
    };

    const handleMoveRule = (index: number, direction: 'UP' | 'DOWN') => {
        const rulesCopy = [...form.selectedRules];
        const targetIndex = direction === 'UP' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= rulesCopy.length) return;

        const temp = rulesCopy[index];
        rulesCopy[index] = rulesCopy[targetIndex];
        rulesCopy[targetIndex] = temp;

        // Re-assign sequence numbers
        const resequenced = rulesCopy.map((r, idx) => ({ ...r, sequence: idx + 1 }));
        setForm({ ...form, selectedRules: resequenced });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.code) {
            toast.error('Structure name and code are required');
            return;
        }

        const payload = {
            name: form.name,
            code: form.code.toUpperCase().trim(),
            description: form.description || undefined,
            isActive: form.isActive,
            rules: form.selectedRules,
        };

        setSubmitting(true);
        try {
            if (editingStructure) {
                await api.put(`/salary/structures/${editingStructure.id}`, payload);
                toast.success('Salary structure updated successfully!');
            } else {
                await api.post('/salary/structures', payload);
                toast.success('Salary structure created successfully!');
            }
            setShowModal(false);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save salary structure');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete structure "${name}"?`)) return;

        try {
            await api.delete(`/salary/structures/${id}`);
            toast.success(`Structure "${name}" deleted`);
            if (selectedStructure?.id === id) setSelectedStructure(null);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete structure');
        }
    };

    const filteredStructures = structures.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    });

    return (
        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <Layers className="w-7 h-7 text-blue-600" />
                        Salary Structures Composition
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Compose ordered salary structures by sequencing rules for execution by the Rule Engine
                    </p>
                </div>

                {canManageStructure && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> New Salary Structure
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search salary structures..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>
                <div className="text-xs text-gray-500 font-medium">{filteredStructures.length} structures</div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Structures Table */}
                <div className={`${selectedStructure ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-3.5">Structure Code & Name</th>
                                    <th className="px-6 py-3.5 text-center">Rules Count</th>
                                    <th className="px-6 py-3.5 text-center">Linked Contracts</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400">
                                            Loading structures...
                                        </td>
                                    </tr>
                                ) : filteredStructures.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400">
                                            No structures found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStructures.map((struct) => {
                                        const isSelected = selectedStructure?.id === struct.id;
                                        const rCount = struct.rules?.length || 0;
                                        const cCount = struct._count?.contracts || struct.contracts?.length || 0;

                                        return (
                                            <tr
                                                key={struct.id}
                                                onClick={() => setSelectedStructure(struct)}
                                                className={`hover:bg-blue-50/40 transition cursor-pointer ${
                                                    isSelected ? 'bg-blue-50/70 font-semibold' : ''
                                                }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                        <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                                            {struct.code}
                                                        </span>
                                                        {struct.name}
                                                    </div>
                                                    {struct.description && (
                                                        <p className="text-[11px] text-gray-400 mt-0.5">{struct.description}</p>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                                                        {rCount} Rules
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-center font-bold text-gray-700">
                                                    {cCount} Active
                                                </td>

                                                <td className="px-6 py-4">
                                                    {struct.isActive ? (
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
                                                        {canManageStructure && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenModal(struct);
                                                                    }}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                                    title="Edit Structure"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(struct.id, struct.name);
                                                                    }}
                                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                                    title="Delete Structure"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
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

                {/* Detail View Drawer */}
                {selectedStructure && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 flex flex-col max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                                    {selectedStructure.code}
                                </span>
                                <h3 className="font-bold text-base text-gray-900 mt-1">{selectedStructure.name}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedStructure(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">
                                Execution Sequence ({selectedStructure.rules?.length || 0} Rules)
                            </h4>
                            <div className="space-y-2 font-mono text-xs">
                                {(selectedStructure.rules || []).map((r: any, idx: number) => {
                                    const sr = r.salaryRule || {};
                                    return (
                                        <div
                                            key={r.id || idx}
                                            className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                                    {r.sequence}
                                                </span>
                                                <span className="font-bold text-gray-900">{sr.code || r.salaryRuleId}</span>
                                            </div>
                                            <span className="text-[11px] text-gray-500">{sr.category}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Structure Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
                        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                            <h2 className="font-bold text-base flex items-center gap-2">
                                <Layers className="w-5 h-5 text-blue-400" />
                                {editingStructure ? `Edit Structure: ${editingStructure.code}` : 'Compose New Salary Structure'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Structure Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Regular Executive Salary"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Structure Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. REG-SAL"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional structure description..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            {/* Rule Selection & Sequence Reordering */}
                            <div>
                                <h4 className="font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Include & Sequence Salary Rules ({form.selectedRules.length} selected)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Available Rules Pool */}
                                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 max-h-60 overflow-y-auto">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                            Available Rules
                                        </span>
                                        {availableRules.map((rule) => {
                                            const selected = form.selectedRules.some((r) => r.salaryRuleId === rule.id);
                                            return (
                                                <label
                                                    key={rule.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                                                        selected ? 'bg-blue-50 border border-blue-200 font-bold' : 'hover:bg-gray-100 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => handleToggleRuleSelection(rule.id)}
                                                            className="w-3.5 h-3.5 text-blue-600 rounded"
                                                        />
                                                        <span className="font-mono text-blue-600">{rule.code}</span>
                                                        <span className="text-gray-700 font-normal">{rule.name}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Execution Order Re-ordering List */}
                                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                                            Execution Sequence Preview
                                        </span>
                                        {form.selectedRules.length === 0 && (
                                            <div className="text-xs text-gray-400 text-center py-6">Check rules to sequence execution.</div>
                                        )}
                                        {form.selectedRules.map((sr, idx) => {
                                            const ruleObj = availableRules.find((r) => r.id === sr.salaryRuleId);
                                            return (
                                                <div
                                                    key={sr.salaryRuleId}
                                                    className="p-2 rounded-lg bg-white border border-blue-200 flex items-center justify-between shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                                                            {sr.sequence}
                                                        </span>
                                                        <span className="font-bold text-gray-900">{ruleObj?.code || sr.salaryRuleId}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveRule(idx, 'UP')}
                                                            disabled={idx === 0}
                                                            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveRule(idx, 'DOWN')}
                                                            disabled={idx === form.selectedRules.length - 1}
                                                            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingStructure ? 'Update Structure' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
