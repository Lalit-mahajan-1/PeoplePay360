import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Wallet,
    Calendar,
    Building2,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    X,
    Users,
    Layers,
    Search,
    Filter,
} from 'lucide-react';

interface PayrunWizardProps {
    onClose: () => void;
    onSuccess: (payrunId: string) => void;
}

export default function PayrunWizard({ onClose, onSuccess }: PayrunWizardProps) {
    const [step, setStep] = useState(1);
    const [structures, setStructures] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingEligible, setFetchingEligible] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        salaryStructureId: '',
        periodStart: '',
        periodEnd: '',
        departmentId: '',
        employeeIds: [] as string[],
    });

    const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const initDefaults = async () => {
            try {
                const [structRes, deptRes] = await Promise.all([
                    api.get('/salary/structures'),
                    api.get('/employees/departments').catch(() => ({ data: { data: [] } })),
                ]);

                const fetchedStructs = structRes.data.data || [];
                setStructures(fetchedStructs);
                setDepartments(deptRes.data.data || []);

                // Default period dates to current month
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

                setForm({
                    name: `${monthName} Payroll`,
                    salaryStructureId: fetchedStructs[0]?.id || '',
                    periodStart: start.toISOString().slice(0, 10),
                    periodEnd: end.toISOString().slice(0, 10),
                    departmentId: '',
                    employeeIds: [],
                });
            } catch (err: any) {
                toast.error('Failed to load salary structures');
            }
        };

        initDefaults();
    }, []);

    const handleStep1Next = async () => {
        if (!form.name || !form.salaryStructureId || !form.periodStart || !form.periodEnd) {
            toast.error('Please complete all required fields (*)');
            return;
        }

        if (new Date(form.periodStart) >= new Date(form.periodEnd)) {
            toast.error('Period end date must be after period start date');
            return;
        }

        setFetchingEligible(true);
        try {
            const params = new URLSearchParams({
                salaryStructureId: form.salaryStructureId,
                periodStart: form.periodStart,
                periodEnd: form.periodEnd,
            });
            if (form.departmentId) params.append('departmentId', form.departmentId);

            const res = await api.get(`/payroll/eligible?${params.toString()}`);
            const list = res.data.data || [];
            setEligibleEmployees(list);

            // By default, select all eligible employees
            setForm((prev) => ({
                ...prev,
                employeeIds: list.map((e: any) => e.id),
            }));

            setStep(2);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch eligible employees');
        } finally {
            setFetchingEligible(false);
        }
    };

    const handleToggleEmployee = (id: string) => {
        setForm((prev) => {
            const exists = prev.employeeIds.includes(id);
            return {
                ...prev,
                employeeIds: exists
                    ? prev.employeeIds.filter((empId) => empId !== id)
                    : [...prev.employeeIds, id],
            };
        });
    };

    const handleSelectAll = () => {
        setForm((prev) => ({
            ...prev,
            employeeIds: eligibleEmployees.map((e) => e.id),
        }));
    };

    const handleClearAll = () => {
        setForm((prev) => ({
            ...prev,
            employeeIds: [],
        }));
    };

    const handleCreatePayrun = async () => {
        if (form.employeeIds.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: form.name,
                salaryStructureId: form.salaryStructureId,
                periodStart: form.periodStart,
                periodEnd: form.periodEnd,
                departmentId: form.departmentId || undefined,
                employeeIds: form.employeeIds,
            };

            const res = await api.post('/payroll/payruns', payload);
            toast.success('Payrun created successfully!');
            const createdId = res.data.data?.id || res.data.data;
            onSuccess(createdId);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create payrun');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = eligibleEmployees.filter((e) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            e.firstName.toLowerCase().includes(term) ||
            e.lastName.toLowerCase().includes(term) ||
            e.employeeCode.toLowerCase().includes(term)
        );
    });

    const selectedWageSum = eligibleEmployees
        .filter((e) => form.employeeIds.includes(e.id))
        .reduce((sum, e) => sum + Number(e.contract?.wage || 0), 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-400/30 flex items-center justify-center font-bold">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white">Create New Payrun</h2>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Step {step} of 2: {step === 1 ? 'Scope & Period Setup' : 'Select Employees'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                            <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-blue-400' : 'bg-slate-600'}`} />
                            <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-blue-400' : 'bg-slate-600'}`} />
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-5 max-w-xl mx-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Payrun Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. September 2026 Regular Payroll"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Salary Structure *
                                </label>
                                <select
                                    value={form.salaryStructureId}
                                    onChange={(e) => setForm({ ...form, salaryStructureId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select Structure...</option>
                                    {structures.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Period Start *
                                    </label>
                                    <input
                                        type="date"
                                        value={form.periodStart}
                                        onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Period End *
                                    </label>
                                    <input
                                        type="date"
                                        value={form.periodEnd}
                                        onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Department Scope (Optional)
                                </label>
                                <select
                                    value={form.departmentId}
                                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-base text-gray-900">Eligible Employees</h3>
                                    <p className="text-xs text-gray-500">
                                        {eligibleEmployees.length} employees with active contracts matching this salary structure.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            {/* Search Filter */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Filter by employee name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500/30 outline-none"
                                />
                            </div>

                            {/* Employee Checklist Container */}
                            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[380px] overflow-y-auto bg-gray-50/50">
                                {filteredEmployees.length === 0 && (
                                    <div className="p-8 text-center text-xs text-gray-400">
                                        No eligible employees found for this structure and period.
                                    </div>
                                )}
                                {filteredEmployees.map((emp) => {
                                    const selected = form.employeeIds.includes(emp.id);
                                    return (
                                        <label
                                            key={emp.id}
                                            className={`flex items-center justify-between p-3.5 cursor-pointer transition ${
                                                selected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-gray-100/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => handleToggleEmployee(emp.id)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                    {emp.firstName?.[0]}
                                                    {emp.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900">
                                                        {emp.firstName} {emp.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span className="font-mono">{emp.employeeCode}</span>
                                                        <span>•</span>
                                                        <span>{emp.department?.name || 'General'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs font-bold text-emerald-700 block">
                                                    ₹{Number(emp.contract?.wage || 0).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Contract Wage</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                    <div>
                        {step === 2 && (
                            <span className="text-xs font-semibold text-gray-600">
                                Selected: <strong className="text-gray-900">{form.employeeIds.length}</strong> employees | Est. Base:{' '}
                                <strong className="text-emerald-700">₹{selectedWageSum.toLocaleString('en-IN')}</strong>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(1)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        )}

                        {step === 1 && (
                            <button
                                onClick={handleStep1Next}
                                disabled={fetchingEligible}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                            >
                                {fetchingEligible ? 'Fetching Eligible...' : 'Continue to Select Employees'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={handleCreatePayrun}
                                disabled={loading || form.employeeIds.length === 0}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {loading ? 'Creating Payrun...' : 'Confirm & Create Payrun'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
