import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Plus, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import MyAttendance from "./MyAttendance";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKEND";

type Employee = { id: string; employeeCode: string; firstName: string; lastName: string; email?: string; department?: { name: string } };
type Attendance = {
  id: string; employeeId: string; workDate: string; checkIn: string | null; checkOut: string | null;
  workedMinutes: number; overtimeMinutes: number; status: AttendanceStatus; notes: string | null;
  isManualEdit: boolean; correctedAt: string | null; correctedBy?: { email: string } | null; employee: Employee;
};

const HR_ROLES = ["ADMIN", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"];
const statuses: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY", "WEEKEND"];

function roundedMinutes(minutes: number) { return Math.max(0, Math.round(minutes / 15) * 15); }
function formatDuration(value: number) {
  const minutes = roundedMinutes(value);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!minutes) return "0 hrs";
  if (!remainder) return `${hours} hrs`;
  if (remainder === 30) return `${hours}.5 hrs`;
  return `${hours} hrs ${remainder} mins`;
}
function toDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)); }
function formatTime(value: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—"; }

function DurationFields({ label, minutes, onChange }: { label: string; minutes: number; onChange: (value: number) => void }) {
  const rounded = roundedMinutes(minutes);
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="grid grid-cols-2 gap-2">
      <input type="number" min="0" value={hours} onChange={(e) => onChange((Math.max(0, Number(e.target.value) || 0) * 60) + remainder)} className="rounded-lg border border-slate-300 px-3 py-2" aria-label={`${label} hours`} />
      <select value={remainder} onChange={(e) => onChange(hours * 60 + Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2" aria-label={`${label} minutes`}>
        <option value={0}>0 mins</option><option value={15}>15 mins</option><option value={30}>30 mins</option><option value={45}>45 mins</option>
      </select>
    </div>
    <p className="mt-1 text-xs text-slate-500">Saved as {formatDuration(rounded)}</p>
  </div>;
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const color: Record<AttendanceStatus, string> = { PRESENT: "bg-emerald-100 text-emerald-700", LATE: "bg-amber-100 text-amber-700", ABSENT: "bg-red-100 text-red-700", HALF_DAY: "bg-orange-100 text-orange-700", ON_LEAVE: "bg-blue-100 text-blue-700", HOLIDAY: "bg-violet-100 text-violet-700", WEEKEND: "bg-slate-100 text-slate-700" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color[status]}`}>{status.replace("_", " ")}</span>;
}

function AttendanceEditor({ record, canDelete, onClose, onSaved }: { record: Attendance; canDelete: boolean; onClose: () => void; onSaved: () => void }) {
  const [checkIn, setCheckIn] = useState(toDateTimeInput(record.checkIn));
  const [checkOut, setCheckOut] = useState(toDateTimeInput(record.checkOut));
  const [workedMinutes, setWorkedMinutes] = useState(record.workedMinutes);
  const [overtimeMinutes, setOvertimeMinutes] = useState(record.overtimeMinutes);
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [notes, setNotes] = useState(record.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!notes.trim()) return toast.error("A correction note is required");
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) return toast.error("Check-out must be after check-in");
    setSaving(true);
    try {
      const payload: Record<string, string | number> = { notes: notes.trim() };
      if (checkIn && checkIn !== toDateTimeInput(record.checkIn)) payload.checkIn = new Date(checkIn).toISOString();
      if (checkOut && checkOut !== toDateTimeInput(record.checkOut)) payload.checkOut = new Date(checkOut).toISOString();
      if (roundedMinutes(workedMinutes) !== roundedMinutes(record.workedMinutes)) payload.workedMinutes = roundedMinutes(workedMinutes);
      if (roundedMinutes(overtimeMinutes) !== roundedMinutes(record.overtimeMinutes)) payload.overtimeMinutes = roundedMinutes(overtimeMinutes);
      if (status !== record.status) payload.status = status;
      await api.put(`/attendance/${record.id}`, payload);
      toast.success("Attendance corrected"); onSaved();
    } catch (error: any) { toast.error(error.response?.data?.message || "Could not save correction"); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete the attendance entry for ${record.employee.firstName} ${record.employee.lastName} on ${formatDate(record.workDate)}?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/attendance/${record.id}`);
      toast.success("Attendance entry deleted");
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not delete attendance entry");
    } finally {
      setDeleting(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-900">Attendance details</h2><p className="text-sm text-slate-500">{record.employee.firstName} {record.employee.lastName} · {record.employee.employeeCode} · {formatDate(record.workDate)}</p></div><button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X size={20} /></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Check in</label><input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Check out</label><input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
        <DurationFields label="Worked time" minutes={workedMinutes} onChange={setWorkedMinutes} />
        <DurationFields label="Overtime" minutes={overtimeMinutes} onChange={setOvertimeMinutes} />
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)} className="w-full rounded-lg border border-slate-300 px-3 py-2">{statuses.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></div>
      </div>
      <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Correction note <span className="text-red-600">*</span></label><textarea required value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Explain why this attendance record is being changed" /></div>
      <div className="mt-6 flex flex-wrap justify-between gap-3"><div>{canDelete && <button type="button" disabled={deleting || saving} onClick={remove} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 size={16} />{deleting ? "Deleting…" : "Delete entry"}</button>}</div><div className="flex gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={saving || deleting} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save correction"}</button></div></div>
    </form>
  </div>;
}

function MedicalAbsenceModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = useState(""); const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10)); const [notes, setNotes] = useState("Medical leave"); const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!employeeId || !notes.trim()) return toast.error("Employee and medical note are required"); setSaving(true); try { await api.post("/attendance", { employeeId, workDate, notes: notes.trim() }); toast.success("Medical leave recorded as holiday"); onSaved(); } catch (error: any) { toast.error(error.response?.data?.message || "Could not record absence"); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex justify-between"><h2 className="text-xl font-bold">Medical absence</h2><button type="button" onClick={onClose}><X /></button></div><label className="mb-1 block text-sm font-medium">Employee</label><select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mb-4 w-full rounded-lg border p-2"><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} ({employee.employeeCode})</option>)}</select><label className="mb-1 block text-sm font-medium">Date</label><input type="date" required value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="mb-4 w-full rounded-lg border p-2" /><label className="mb-1 block text-sm font-medium">Medical note <span className="text-red-600">*</span></label><textarea required value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-5 w-full rounded-lg border p-2" rows={3} /><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">{saving ? "Saving…" : "Record absence"}</button></div></form></div>;
}

function AttendanceManagement({ canDelete }: { canDelete: boolean }) {
  const [records, setRecords] = useState<Attendance[]>([]); const [employees, setEmployees] = useState<Employee[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [date, setDate] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0); const [selected, setSelected] = useState<Attendance | null>(null); const [medicalOpen, setMedicalOpen] = useState(false);
  const load = async () => { setLoading(true); try { const response = await api.get("/attendance", { params: { search: search.trim() || undefined, date: date || undefined, page, limit: 20 } }); setRecords(response.data.data); setTotal(response.data.total); setTotalPages(response.data.totalPages || 1); } catch (error: any) { toast.error(error.response?.data?.message || "Failed to load attendance"); } finally { setLoading(false); } };
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [search, date, page]);
  useEffect(() => { api.get("/employees").then((response) => setEmployees(response.data.data)).catch(() => undefined); }, []);
  const openRecord = async (record: Attendance) => { try { const response = await api.get(`/attendance/${record.id}`); setSelected(response.data.data); } catch { toast.error("Could not load attendance details"); } };
  const updateFilters = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  return <div className="p-4 sm:p-6 lg:p-8"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold text-slate-900">Attendance</h1><p className="mt-1 text-sm text-slate-500">Review, correct, and manage employee attendance.</p></div><button onClick={() => setMedicalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"><Plus size={18} />Medical absence</button></div><div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]"><label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={search} onChange={(e) => updateFilters(setSearch)(e.target.value)} placeholder="Search name, code, email, or YYYY-MM-DD" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3" /></label><input type="date" value={date} onChange={(e) => updateFilters(setDate)(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5" /></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Check in</th><th className="px-4 py-3">Check out</th><th className="px-4 py-3">Worked</th><th className="px-4 py-3">Overtime</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading attendance…</td></tr> : records.length ? records.map((record) => <tr key={record.id} onClick={() => openRecord(record)} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/50"><td className="px-4 py-3"><div className="font-medium text-slate-900">{record.employee.firstName} {record.employee.lastName}</div><div className="text-xs text-slate-500">{record.employee.employeeCode} · {record.employee.department?.name || "No department"}</div></td><td className="px-4 py-3 text-slate-700">{formatDate(record.workDate)}</td><td className="px-4 py-3">{formatTime(record.checkIn)}</td><td className="px-4 py-3">{formatTime(record.checkOut)}</td><td className="px-4 py-3">{formatDuration(record.workedMinutes)}</td><td className="px-4 py-3">{formatDuration(record.overtimeMinutes)}</td><td className="px-4 py-3"><StatusBadge status={record.status} /></td></tr>) : <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No attendance records match the filters.</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600"><span>{total} records</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border p-1.5 disabled:opacity-40"><ChevronLeft size={16} /></button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border p-1.5 disabled:opacity-40"><ChevronRight size={16} /></button></div></div></div>{selected && <AttendanceEditor record={selected} canDelete={canDelete} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}{medicalOpen && <MedicalAbsenceModal employees={employees} onClose={() => setMedicalOpen(false)} onSaved={() => { setMedicalOpen(false); load(); }} />}</div>;
}

export default function AttendancePage() { const { user } = useAuth(); const canDelete = user?.role === "ADMIN" || user?.role === "HR_MANAGER"; return user && HR_ROLES.includes(user.role) ? <AttendanceManagement canDelete={canDelete} /> : <MyAttendance />; }
