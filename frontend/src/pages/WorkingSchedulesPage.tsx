import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Plus, CalendarClock, Edit2, Trash2, Clock, Users, FileText, X, Check } from "lucide-react";

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const WEEKDAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

type DayForm = { weekday: string; startTime: string; endTime: string; breakMinutes: number };
type Schedule = { id: string; name: string; code: string; description?: string; isActive: boolean; weeklyHours: number; employeeCount: number; contractCount: number; days?: any[] };

function emptyDays(): DayForm[] {
    return WEEKDAYS.slice(0, 5).map(w => ({ weekday: w, startTime: "09:00", endTime: "18:00", breakMinutes: 60 }));
}

export default function WorkingSchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Schedule | null>(null);
    const [form, setForm] = useState({ name: "", code: "", description: "", isActive: true, days: emptyDays() });

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const res = await api.get("/working-schedules?includeInactive=true");
            setSchedules(res.data.data || []);
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to load schedules"); }
        finally { setLoading(false); }
    }

    function openNew() {
        setEditing(null);
        setForm({ name: "", code: "", description: "", isActive: true, days: emptyDays() });
        setShowForm(true);
    }

    function openEdit(s: Schedule) {
        setEditing(s);
        const days = (s.days || []).length > 0
            ? (s.days as any[]).map(d => ({ weekday: d.weekday, startTime: new Date(d.startTime).toTimeString().slice(0, 5), endTime: new Date(d.endTime).toTimeString().slice(0, 5), breakMinutes: d.breakMinutes }))
            : emptyDays();
        setForm({ name: s.name, code: s.code, description: s.description || "", isActive: s.isActive, days });
        setShowForm(true);
    }

    async function save() {
        try {
            const payload = { ...form, days: form.days.filter(d => d.startTime && d.endTime) };
            if (editing) {
                await api.put(`/working-schedules/${editing.id}`, payload);
                toast.success("Schedule updated");
            } else {
                await api.post("/working-schedules", payload);
                toast.success("Schedule created");
            }
            setShowForm(false);
            load();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to save"); }
    }

    async function remove(id: string) {
        if (!confirm("Delete this working schedule?")) return;
        try {
            await api.delete(`/working-schedules/${id}`);
            toast.success("Schedule deleted");
            load();
        } catch (e: any) { toast.error(e.response?.data?.message || "Delete failed"); }
    }

    function toggleDay(w: string) {
        setForm(f => {
            const has = f.days.find(d => d.weekday === w);
            if (has) return { ...f, days: f.days.filter(d => d.weekday !== w) };
            return { ...f, days: [...f.days, { weekday: w, startTime: "09:00", endTime: "18:00", breakMinutes: 60 }].sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday)) };
        });
    }

    function updateDay(idx: number, key: keyof DayForm, val: any) {
        setForm(f => {
            const days = [...f.days];
            days[idx] = { ...days[idx], [key]: val };
            return { ...f, days };
        });
    }

    const weeklyHours = (days: DayForm[]) => {
        let mins = 0;
        for (const d of days) {
            if (!d.startTime || !d.endTime) continue;
            const [sh, sm] = d.startTime.split(":").map(Number);
            const [eh, em] = d.endTime.split(":").map(Number);
            mins += Math.max(0, (eh * 60 + em) - (sh * 60 + sm) - (Number(d.breakMinutes) || 0));
        }
        return (mins / 60).toFixed(2);
    };

    return (
        <div className="p-6 md:p-8 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif] max-w-[1400px] mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-[-0.01em] flex items-center gap-2">
                        <CalendarClock className="w-6 h-6 text-blue-600" /> Working Schedules
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configure weekly work patterns for employees and contracts</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98]">
                    <Plus className="w-4 h-4" /> New Schedule
                </button>
            </div>

            {loading ? <div className="text-gray-500 text-sm">Loading...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {schedules.length === 0 && <div className="col-span-full text-gray-400 py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">No schedules yet. Create your first one!</div>}
                    {schedules.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{s.name}</h3>
                                        {s.isActive ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">ACTIVE</span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">INACTIVE</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{s.code}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => remove(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                {s.description && <p className="text-sm text-gray-600">{s.description}</p>}
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1.5 text-gray-600"><Clock className="w-4 h-4 text-blue-500" /><b className="text-gray-900">{s.weeklyHours}</b> hrs/wk</span>
                                    <span className="flex items-center gap-1.5 text-gray-600"><Users className="w-4 h-4 text-indigo-500" />{s.employeeCount}</span>
                                    <span className="flex items-center gap-1.5 text-gray-600"><FileText className="w-4 h-4 text-orange-500" />{s.contractCount}</span>
                                </div>
                                <div className="grid grid-cols-7 gap-1 pt-2">
                                    {WEEKDAYS.map(w => {
                                        const day = (s.days as any[])?.find(d => d.weekday === w);
                                        return (
                                            <div key={w} className={`text-center rounded-lg py-2 px-1 ${day ? "bg-blue-50 border border-blue-100" : "bg-gray-50 opacity-40"}`}>
                                                <div className="text-[10px] font-bold text-gray-500">{WEEKDAY_SHORT[w]}</div>
                                                {day ? (
                                                    <div className="text-[10px] text-blue-700 font-semibold mt-0.5 leading-tight">
                                                        {new Date(day.startTime).toTimeString().slice(0, 5)}
                                                        <div>{new Date(day.endTime).toTimeString().slice(0, 5)}</div>
                                                    </div>
                                                ) : <div className="text-[10px] mt-1">—</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
                            <h2 className="font-bold text-lg text-gray-900">{editing ? "Edit Working Schedule" : "Create Working Schedule"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Schedule Name *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition text-sm outline-none" placeholder="Standard 5-Day Week" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Code *</label>
                                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition text-sm outline-none font-mono" placeholder="STD-5D" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition text-sm outline-none resize-none" placeholder="Describe this schedule..." />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weekly Pattern</label>
                                    <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Total {weeklyHours(form.days)} hrs/week</div>
                                </div>
                                <div className="space-y-2">
                                    {WEEKDAYS.map(w => {
                                        const idx = form.days.findIndex(d => d.weekday === w);
                                        const day = idx >= 0 ? form.days[idx] : null;
                                        return (
                                            <div key={w} className={`rounded-xl border transition ${day ? "border-blue-100 bg-blue-50/30" : "border-gray-100 bg-gray-50/50"}`}>
                                                <div className="flex items-center gap-3 p-3">
                                                    <button onClick={() => toggleDay(w)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${day ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-400 hover:border-blue-300"}`}>
                                                        {day ? <Check className="w-4 h-4" /> : WEEKDAY_SHORT[w].slice(0, 1)}
                                                    </button>
                                                    <div className="w-20 text-sm font-semibold text-gray-700">{WEEKDAY_SHORT[w]}</div>
                                                    {day ? (
                                                        <>
                                                            <input type="time" value={day.startTime} onChange={e => updateDay(idx, "startTime", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30" />
                                                            <span className="text-gray-400 text-sm">to</span>
                                                            <input type="time" value={day.endTime} onChange={e => updateDay(idx, "endTime", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30" />
                                                            <div className="ml-auto flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">Break (min)</span>
                                                                <input type="number" value={day.breakMinutes} onChange={e => updateDay(idx, "breakMinutes", Number(e.target.value))} className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30" min={0} />
                                                            </div>
                                                        </>
                                                    ) : <div className="text-sm text-gray-400 italic">Day off</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-blue-600" />
                                <span className="text-sm text-gray-700">Schedule is active and available for assignment</span>
                            </label>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                            <button onClick={save} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">{editing ? "Update Schedule" : "Create Schedule"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
