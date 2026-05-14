import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, CheckCircle, Stethoscope, X, Loader2, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

const statusCfg: Record<string, { cls: string; dot: string; icon: any; label: string }> = {
  Confirmed:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle, label: 'Confirmed'    },
  Pending:       { cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   icon: Clock,       label: 'Pending'      },
  'In Progress': { cls: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500',     icon: Stethoscope, label: 'In Progress'  },
  Completed:     { cls: 'bg-gray-50 text-gray-400 border-gray-200',          dot: 'bg-gray-300',    icon: CheckCircle, label: 'Completed'    },
};

const avatarColors = [
  'from-sky-400 to-sky-600', 'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-500', 'from-amber-400 to-orange-500',
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

const todayIST = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' });
const inputCls = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent';

export default function Appointments() {
  const [appts, setAppts]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ time: '', patient: '', reason: '' });

  // persist status changes in localStorage so they survive refresh
  const STORAGE_KEY = 'cl_appt_status';
  const getSavedStatuses = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  };
  const saveStatus = (id: string, status: string) => {
    const saved = getSavedStatuses();
    saved[id] = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  };

  const fetchAppts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAppointments();
      const saved = getSavedStatuses();
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      setAppts(res.data.map((a: any) => {
        const id = a.patient_id + a.appointment_date;
        const apptDay = a.appointment_date.slice(0, 10);
        const apptDate = new Date(a.appointment_date);
        // use saved status if exists, otherwise derive from date
        let status = saved[id] ?? (apptDate < now && apptDay !== todayStr ? 'Completed' : 'Confirmed');
        return { ...a, id, status };
      }));
    } catch {
      setAppts([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAppts(); }, []);

  const updateStatus = (id: string, status: string) => {
    saveStatus(id, status);
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const markStart = (id: string) => updateStatus(id, 'In Progress');
  const markDone  = (id: string) => updateStatus(id, 'Completed');

  const addAppt = () => {
    if (!form.time || !form.patient || !form.reason) return;
    const dt = new Date();
    const [h, m] = form.time.split(':');
    dt.setHours(parseInt(h), parseInt(m), 0);
    const id = Date.now().toString();
    saveStatus(id, 'Pending');
    setAppts(prev => [...prev, {
      id,
      patient_id: form.patient,
      appointment_date: dt.toISOString(),
      timeline: form.reason,
      status: 'Pending',
    }]);
    setForm({ time: '', patient: '', reason: '' });
    setShowModal(false);
  };

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const confirmed  = appts.filter(a => a.status === 'Confirmed').length;
  const pending    = appts.filter(a => a.status === 'Pending').length;
  const inProgress = appts.filter(a => a.status === 'In Progress').length;

  const now = new Date();
  const displayed = appts.filter(a => {
    const d = new Date(a.appointment_date);
    if (filter === 'upcoming') return d >= now;
    if (filter === 'past')     return d < now;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
            <p className="text-sm text-gray-500 mt-0.5">{todayIST}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAppts} className="p-2 hover:bg-sky-50 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4 text-sky-500" />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-200">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Confirmed',   value: confirmed,  cls: 'border-emerald-200 bg-emerald-50', val: 'text-emerald-700' },
          { label: 'Pending',     value: pending,    cls: 'border-amber-200 bg-amber-50',     val: 'text-amber-700'   },
          { label: 'In Progress', value: inProgress, cls: 'border-sky-200 bg-sky-50',         val: 'text-sky-700'     },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border px-5 py-4 ${s.cls}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.val}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-500" />
          <span className="font-semibold text-slate-800 text-sm">Schedule</span>
          <div className="ml-auto flex items-center gap-1">
            {(['all', 'upcoming', 'past'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all
                  ${filter === f ? 'bg-sky-500 text-white' : 'text-gray-400 hover:text-slate-600 hover:bg-gray-100'}`}>
                {f}
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-400">{displayed.length} record{displayed.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium text-slate-500">No {filter === 'all' ? '' : filter} appointments</p>
            <p className="text-xs mt-1">Appointments are created automatically after each triage submission</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map((a, i) => {
              const cfg = statusCfg[a.status] ?? statusCfg['Pending'];
              const StatusIcon = cfg.icon;
              const done = a.status === 'Completed';
              return (
                <div key={a.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${done ? 'opacity-40' : 'hover:bg-sky-50/40'}`}>

                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-sm font-bold text-slate-700">{formatTime(a.appointment_date)}</span>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} ml-auto mt-1`} />
                  </div>

                  <div className="flex flex-col items-center self-stretch">
                    <div className={`w-0.5 flex-1 ${i === 0 ? 'bg-transparent' : 'bg-gray-100'}`} />
                    <div className={`w-3 h-3 rounded-full border-2 border-white shadow ${cfg.dot}`} />
                    <div className={`w-0.5 flex-1 ${i === displayed.length - 1 ? 'bg-transparent' : 'bg-gray-100'}`} />
                  </div>

                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {a.patient_id.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{a.patient_id}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.timeline} · {formatDate(a.appointment_date)}</div>
                  </div>

                  <span className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${cfg.cls}`}>
                    <StatusIcon className="w-3 h-3" />{cfg.label}
                  </span>

                  {done ? (
                    <span className="text-xs text-gray-400 flex-shrink-0">Done</span>
                  ) : a.status === 'Confirmed' || a.status === 'Pending' ? (
                    <button onClick={() => markStart(a.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold transition-all flex-shrink-0">
                      <Stethoscope className="w-3.5 h-3.5" /> Start
                    </button>
                  ) : (
                    <button onClick={() => markDone(a.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">New Appointment</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Time</label>
              <input type="time" className={inputCls} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Patient ID</label>
              <input type="text" placeholder="Patient ID" className={inputCls} value={form.patient} onChange={e => setForm(p => ({ ...p, patient: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Reason</label>
              <input type="text" placeholder="Visit reason" className={inputCls} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={addAppt} disabled={!form.time || !form.patient || !form.reason}
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition-all">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
