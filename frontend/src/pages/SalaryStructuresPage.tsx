import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, X, Briefcase, Layers, Edit2, Trash2, Tag, Gauge, Percent, Calculator, Hash, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Tab = "structures" | "rules";
const CATEGORIES = ["BASIC", "ALLOWANCE", "GROSS", "DEDUCTION", "EMPLOYER_CONTRIBUTION", "NET"];
const CATEGORY_STYLES: Record<string, string> = {
    BASIC: "bg-indigo-50 text-indigo-600 border-indigo-200",
    ALLOWANCE: "bg-emerald-50 text-emerald-600 border-emerald-200",
    GROSS: "bg-blue-50 text-blue-600 border-blue-200",
    DEDUCTION: "bg-red-50 text-red-600 border-red-200",
    EMPLOYER_CONTRIBUTION: "bg-purple-50 text-purple-600 border-purple-200",
    NET: "bg-teal-50 text-teal-600 border-teal-200",
};

export default function SalaryStructuresPage() {
    const { hasRole } = useAuth();
    const canManage = hasRole(["ADMIN"]);
    const [tab, setTab] = useState<Tab>("structures");
    const [structures, setStructures] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [showStructForm, setShowStructForm] = useState(false);
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [editingStruct, setEditingStruct] = useState<any>(null);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [structForm, setStructForm] = useState<any>({ name: "", code: "", description: "", isActive: true, rules: [] as any[] });
    const [ruleForm, setRuleForm] = useState<any>({ name: "", code: "", category: "ALLOWANCE", computationType: "FIXED", fixedAmount: 0, percentage: 0, formula: "", isActive: true, description: "" });
    const [structDetail, setStructDetail] = useState<any>(null);

    useEffect(() => { load(); }, []);
    async function load() {
        try {
            const [s, r] = await Promise.all([api.get("/salary/structures?includeInactive=true"), api.get("/salary/rules?includeInactive=true")]);
            setStructures(s.data.data || []);
            setRules(r.data.data || []);
        } catch { toast.error("Failed to load"); }
    }

    async function openStructDetail(id: string) {
        try { const r = await api.get(`/salary/structures/${id}`); setStructDetail(r.data.data); }
        catch { toast.error("Failed"); }
    }

    function openNewStruct() {
        setEditingStruct(null);
        setStructForm({ name: "", code: "", description: "", isActive: true, rules: [] });
        setShowStructForm(true);
    }

    function openEditStruct(s: any) {
        setEditingStruct(s);
        setStructForm({ name: s.name, code: s.code, description: s.description || "", isActive: s.isActive, rules: (s.rules || []).map((r: any) => ({ salaryRuleId: r.salaryRuleId, sequence: r.sequence })) });
        setShowStructForm(true);
    }

    function addRuleToStruct(ruleId: string) {
        if (structForm.rules.find((r: any) => r.salaryRuleId === ruleId)) return;
        setStructForm({ ...structForm, rules: [...structForm.rules, { salaryRuleId: ruleId, sequence: structForm.rules.length + 1 }] });
    }

    function removeRuleFromStruct(idx: number) {
        const newRules = structForm.rules.filter((_: any, i: number) => i !== idx).map((r: any, i: number) => ({ ...r, sequence: i + 1 }));
        setStructForm({ ...structForm, rules: newRules });
    }

    function moveRule(idx: number, dir: -1 | 1) {
        const rules = [...structForm.rules];
        const j = idx + dir;
        if (j < 0 || j >= rules.length) return;
        [rules[idx], rules[j]] = [rules[j], rules[idx]];
        rules.forEach((r, i) => r.sequence = i + 1);
        setStructForm({ ...structForm, rules });
    }

    async function saveStruct() {
        try {
            if (editingStruct) await api.put(`/salary/structures/${editingStruct.id}`, structForm);
            else await api.post("/salary/structures", structForm);
            toast.success(editingStruct ? "Structure updated" : "Structure created");
            setShowStructForm(false); load();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    }

    function openNewRule() {
        setEditingRule(null);
        setRuleForm({ name: "", code: "", category: "ALLOWANCE", computationType: "FIXED", fixedAmount: 0, percentage: 0, formula: "", isActive: true, description: "" });
        setShowRuleForm(true);
    }

    function openEditRule(r: any) {
        setEditingRule(r);
        setRuleForm({ name: r.name, code: r.code, category: r.category, computationType: r.computationType, fixedAmount: Number(r.fixedAmount || 0), percentage: Number(r.percentage || 0), formula: r.formula || "", isActive: r.isActive, description: r.description || "" });
        setShowRuleForm(true);
    }

    async function saveRule() {
        try {
            if (editingRule) await api.put(`/salary/rules/${editingRule.id}`, ruleForm);
            else await api.post("/salary/rules", ruleForm);
            toast.success(editingRule ? "Rule updated" : "Rule created");
            setShowRuleForm(false); load();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    }

    async function deleteRule(id: string) {
        if (!confirm("Delete this salary rule?")) return;
        try { await api.delete(`/salary/rules/${id}`); toast.success("Rule deleted"); load(); }
        catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    }

    async function deleteStruct(id: string) {
        if (!confirm("Delete this salary structure?")) return;
        try { await api.delete(`/salary/structures/${id}`); toast.success("Structure deleted"); load(); setStructDetail(null); }
        catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    }

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1500px] mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-[-0.01em] flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-purple-600" /> Salary Structures & Rules
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Define how earnings, allowances, and deductions are calculated</p>
                </div>
                {canManage && (
                    tab === "structures" ? (
                        <button onClick={openNewStruct} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98]">
                            <Plus className="w-4 h-4" /> New Structure
                        </button>
                    ) : (
                        <button onClick={openNewRule} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98]">
                            <Plus className="w-4 h-4" /> New Salary Rule
                        </button>
                    )
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex gap-2 border-b border-gray-200 px-6 md:px-8">
                    {[{ id: "structures", label: "Structures", icon: Layers }, { id: "rules", label: "Salary Rules", icon: Calculator }].map(t => {
                        const Icon = t.icon as any;
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`flex items-center gap-2 py-4 px-1 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap mr-6 ${active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                <Icon className="w-4 h-4" />{t.label}
                                {t.id === "structures" && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">{structures.length}</span>}
                                {t.id === "rules" && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">{rules.length}</span>}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 md:p-8">
                    {tab === "structures" && !structDetail && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {structures.length === 0 && <div className="col-span-full text-center py-16 text-gray-400">No salary structures yet</div>}
                            {structures.map(s => (
                                <div key={s.id} onClick={() => openStructDetail(s.id)} className="rounded-2xl border border-gray-100 p-5 hover:shadow-md transition cursor-pointer group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{s.name}</h3>
                                            <p className="font-mono text-xs text-gray-400 mt-0.5">{s.code}</p>
                                        </div>
                                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                            {canManage && (
                                                <>
                                                    <button onClick={() => openEditStruct(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteStruct(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {s.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{s.description}</p>}
                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50 text-center">
                                        <div>
                                            <div className="text-lg font-bold text-indigo-600">{s.ruleCount || 0}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rules</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-blue-600">{s.contractCount || 0}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contracts</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-orange-500">{s.payrunCount || 0}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payruns</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        {s.isActive ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200"><CheckCircle2 className="w-3 h-3" />Active</span>
                                        ) : <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Inactive</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "structures" && structDetail && (
                        <div>
                            <button onClick={() => setStructDetail(null)} className="text-sm text-blue-600 font-semibold hover:underline mb-4 inline-flex items-center gap-1">← Back to Structures</button>
                            <div className="rounded-2xl border border-gray-100 p-6 bg-gradient-to-br from-indigo-50/50 to-white">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-gray-900">{structDetail.name}</h2>
                                            <span className="font-mono text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-100">{structDetail.code}</span>
                                        </div>
                                        {structDetail.description && <p className="text-sm text-gray-600 mt-2 max-w-xl">{structDetail.description}</p>}
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditStruct(structDetail)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200">Edit</button>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers className="w-4 h-4" /> Structure Rules ({structDetail.rules?.length || 0})</h3>
                                <div className="space-y-2">
                                    {(!structDetail.rules || structDetail.rules.length === 0) && <div className="text-center py-10 text-gray-400 rounded-xl border-2 border-dashed border-gray-200">No rules added to this structure yet</div>}
                                    {(structDetail.rules || []).map((link: any, idx: number) => {
                                        const rule = link.salaryRule;
                                        const IconComp = rule.computationType === "FIXED" ? Hash : rule.computationType === "PERCENTAGE" ? Percent : Calculator;
                                        return (
                                            <div key={link.id} className="rounded-xl bg-white border border-gray-100 p-4 flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-gray-900">{rule.name}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[rule.category] || ""}`}>{rule.category}</span>
                                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{rule.code}</span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="inline-flex items-center gap-1"><IconComp className="w-3 h-3" />{rule.computationType}</span>
                                                        {rule.computationType === "FIXED" && <span>₹{Number(rule.fixedAmount || 0).toLocaleString()}</span>}
                                                        {rule.computationType === "PERCENTAGE" && <span>{rule.percentage}%</span>}
                                                        {rule.computationType === "FORMULA" && <code className="font-mono bg-gray-50 px-2 py-0.5 rounded">{rule.formula}</code>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {structDetail.contracts && structDetail.contracts.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Active Contracts Using This Structure ({structDetail.contracts.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {structDetail.contracts.map((c: any) => (
                                                <div key={c.id} className="rounded-lg bg-white border border-gray-100 p-3 text-sm flex items-center justify-between">
                                                    <span className="font-semibold text-gray-800">{c.employee.firstName} {c.employee.lastName}</span>
                                                    <span className="text-xs font-mono text-gray-500">{c.employee.employeeCode}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "rules" && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                                        <th className="px-5 py-3">Rule</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3">Computation</th>
                                        <th className="px-5 py-3">Value</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Used By</th>
                                        <th className="px-5 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.length === 0 && <tr><td colSpan={7} className="text-center py-16 text-gray-400 border-t border-gray-50">No salary rules yet</td></tr>}
                                    {rules.map(r => {
                                        const Icon = r.computationType === "FIXED" ? Hash : r.computationType === "PERCENTAGE" ? Percent : Calculator;
                                        return (
                                            <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-900">{r.name}</div>
                                                    <div className="font-mono text-xs text-gray-400">{r.code}</div>
                                                    {r.description && <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border ${CATEGORY_STYLES[r.category] || ""}`}>{r.category}</span>
                                                </td>
                                                <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-gray-600 font-medium"><Icon className="w-4 h-4" />{r.computationType}</span></td>
                                                <td className="px-5 py-4 font-mono text-gray-900 font-semibold">
                                                    {r.computationType === "FIXED" && `₹${Number(r.fixedAmount || 0).toLocaleString()}`}
                                                    {r.computationType === "PERCENTAGE" && `${r.percentage}%`}
                                                    {r.computationType === "FORMULA" && <span className="text-xs bg-gray-50 px-2 py-1 rounded">{r.formula}</span>}
                                                </td>
                                                <td className="px-5 py-4">{r.isActive ? <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">ACTIVE</span> : <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">INACTIVE</span>}</td>
                                                <td className="px-5 py-4 text-gray-600 font-semibold">{r._count?.structures || 0}</td>
                                                <td className="px-5 py-4">
                                                    {canManage && (
                                                        <div className="flex gap-1 justify-end">
                                                            <button onClick={() => openEditRule(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteRule(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showStructForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowStructForm(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10"><h2 className="font-bold text-lg text-gray-900">{editingStruct ? "Edit Structure" : "Create Salary Structure"}</h2><button onClick={() => setShowStructForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Name *</label><input value={structForm.name} onChange={e => setStructForm({ ...structForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Regular Full-Time Salary" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Code *</label><input value={structForm.code} onChange={e => setStructForm({ ...structForm, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" placeholder="REG-SAL" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label><textarea rows={2} value={structForm.description} onChange={e => setStructForm({ ...structForm, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" /></div>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Tag className="w-4 h-4" /> Included Rules (ordered by sequence)</label>
                                    <select className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white outline-none" value="" onChange={e => { if (e.target.value) addRuleToStruct(e.target.value); e.currentTarget.value = ""; }}>
                                        <option value="">+ Add rule...</option>
                                        {rules.filter(r => !structForm.rules.find((sr: any) => sr.salaryRuleId === r.id)).map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                                    </select>
                                </div>
                                <div className="rounded-2xl border-2 border-dashed border-gray-200 p-3 space-y-2 min-h-[120px]">
                                    {structForm.rules.length === 0 && <div className="text-center text-sm text-gray-400 py-8">No rules added yet. Add rules above and reorder using arrows.</div>}
                                    {structForm.rules.map((sr: any, idx: number) => {
                                        const rule = rules.find(r => r.id === sr.salaryRuleId);
                                        if (!rule) return null;
                                        return (
                                            <div key={sr.salaryRuleId} className="rounded-xl bg-white border border-gray-100 p-3 flex items-center gap-3 group">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm text-gray-900 truncate">{rule.name}</div>
                                                    <div className="flex gap-2 text-xs text-gray-500 mt-0.5"><span className={`px-1.5 py-0.5 rounded border ${CATEGORY_STYLES[rule.category] || ""}`}>{rule.category}</span><span className="font-mono">{rule.code}</span></div>
                                                </div>
                                                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                                                    <button onClick={() => moveRule(idx, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500" disabled={idx === 0}><ChevronUp className="w-4 h-4" /></button>
                                                    <button onClick={() => moveRule(idx, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-500" disabled={idx === structForm.rules.length - 1}><ChevronDown className="w-4 h-4" /></button>
                                                    <button onClick={() => removeRuleFromStruct(idx)} className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"><X className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={structForm.isActive} onChange={e => setStructForm({ ...structForm, isActive: e.target.checked })} className="w-4 h-4 rounded text-blue-600" /><span className="text-sm text-gray-700">Structure is active</span></label>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setShowStructForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                            <button onClick={saveStruct} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm">{editingStruct ? "Update Structure" : "Create Structure"}</button>
                        </div>
                    </div>
                </div>
            )}

            {showRuleForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRuleForm(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white"><h2 className="font-bold text-lg text-gray-900">{editingRule ? "Edit Salary Rule" : "Create Salary Rule"}</h2><button onClick={() => setShowRuleForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Name *</label><input value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="House Rent Allowance" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Code *</label><input value={ruleForm.code} onChange={e => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" placeholder="HRA" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category *</label>
                                    <select value={ruleForm.category} onChange={e => setRuleForm({ ...ruleForm, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Computation *</label>
                                    <select value={ruleForm.computationType} onChange={e => setRuleForm({ ...ruleForm, computationType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                                        <option value="FIXED">Fixed Amount</option>
                                        <option value="PERCENTAGE">Percentage</option>
                                        <option value="FORMULA">Formula</option>
                                    </select>
                                </div>
                            </div>
                            {ruleForm.computationType === "FIXED" && (
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Fixed Amount (₹)</label>
                                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span><input type="number" value={ruleForm.fixedAmount} onChange={e => setRuleForm({ ...ruleForm, fixedAmount: Number(e.target.value) })} className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
                                </div>
                            )}
                            {ruleForm.computationType === "PERCENTAGE" && (
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Percentage (%) <span className="text-gray-400 font-normal normal-case">of Basic (earnings) or Gross (deductions)</span></label>
                                    <div className="relative"><input type="number" step="0.01" value={ruleForm.percentage} onChange={e => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })} className="w-full pr-8 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span></div>
                                </div>
                            )}
                            {ruleForm.computationType === "FORMULA" && (
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Formula <span className="text-gray-400 font-normal normal-case">Use codes like BASIC, HRA. Example: BASIC + HRA - TAX</span></label>
                                    <textarea value={ruleForm.formula} onChange={e => setRuleForm({ ...ruleForm, formula: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none font-mono resize-none" placeholder="GROSS - PF - PT" />
                                </div>
                            )}
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label><textarea rows={2} value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" /></div>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ruleForm.isActive} onChange={e => setRuleForm({ ...ruleForm, isActive: e.target.checked })} className="w-4 h-4 rounded text-blue-600" /><span className="text-sm text-gray-700">Rule is active and available for use</span></label>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setShowRuleForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                            <button onClick={saveRule} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-sm">{editingRule ? "Update Rule" : "Create Rule"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
