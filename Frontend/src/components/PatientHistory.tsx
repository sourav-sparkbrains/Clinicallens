import { useState, useEffect, useRef } from 'react';
import { User, Clock, Plus, Search, ChevronRight, FileText, Stethoscope, AlertCircle, CheckCircle, Loader2, RefreshCw, Upload } from 'lucide-react';
import apiService from '../services/api';

function urgencyStatus(urgency: string) {
  if (urgency === 'High' || urgency === 'emergency' || urgency === 'urgent')
    return { label: 'Critical', cls: 'bg-rose-50 text-rose-600 border-rose-200', icon: AlertCircle };
  if (urgency === 'Medium' || urgency === 'moderate')
    return { label: 'Pending', cls: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock };
  return { label: 'Reviewed', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle };
}

function relativeDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

function formatNoteDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const avatarColors = [
  'from-sky-400 to-sky-600', 'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-500', 'from-amber-400 to-orange-500',
];

const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
  Pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-600 border-amber-200',       icon: Clock },
  Reviewed: { label: 'Reviewed', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle },
  Critical: { label: 'Critical', cls: 'bg-rose-50 text-rose-600 border-rose-200',          icon: AlertCircle },
};

export default function PatientHistory() {
  const [patients, setPatients]               = useState<any[]>([]);
  const [selected, setSelected]               = useState<any>(null);
  const [notes, setNotes]                     = useState<any[]>([]);
  const [newNote, setNewNote]                 = useState('');
  const [search, setSearch]                   = useState('');
  const [loadingList, setLoadingList]         = useState(true);
  const [loadingNotes, setLoadingNotes]       = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [followupFile, setFollowupFile]       = useState<File | null>(null);
  const [followupSymptoms, setFollowupSymptoms] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupResult, setFollowupResult]   = useState<any>(null);
  const followupRef = useRef<HTMLInputElement>(null);

  const fetchPatients = async () => {
    setLoadingList(true);
    try {
      const res = await apiService.getPatients();
      setPatients(res.data);
      if (res.data.length > 0 && !selected) setSelected(res.data[0]);
    } catch {
      setPatients([]);
    }
    setLoadingList(false);
  };

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingNotes(true);
    apiService.getPatientNotes(selected.patient_id)
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false));
  }, [selected]);

  const selectPatient = (p: any) => {
    setSelected(p);
    setNewNote('');
    setFollowupFile(null);
    setFollowupResult(null);
    setFollowupSymptoms('');
  };

  const submitFollowup = async () => {
    if (!followupFile || !selected) return;
    setFollowupLoading(true);
    const fd = new FormData();
    fd.append('file', followupFile);
    fd.append('patient_id', selected.patient_id);
    if (followupSymptoms.trim()) fd.append('symptoms', followupSymptoms);
    try {
      const res = await apiService.followup(fd);
      setFollowupResult(res.data);
      fetchPatients();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Follow-up failed.');
    }
    setFollowupLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim() || !selected) return;
    setSaving(true);
    try {
      await apiService.addPatientNote(selected.patient_id, newNote.trim());
      const res = await apiService.getPatientNotes(selected.patient_id);
      setNotes(res.data);
    } catch {
      setNotes(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), note: newNote.trim() }, ...prev]);
    }
    setNewNote('');
    setSaving(false);
  };

  const filtered = patients.filter(p =>
    p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
    p.complaint.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">Clinical notes, visit history and case tracking</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={fetchPatients} className="p-2 hover:bg-sky-50 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4 text-sky-500" />
          </button>
          <div className="flex gap-2 text-xs">
            {Object.entries(statusConfig).map(([k, v]) => (
              <span key={k} className={`px-2.5 py-1 rounded-full border font-medium ${v.cls}`}>{v.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Patient List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by ID or condition..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent" />
            </div>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-gray-50">
            {loadingList ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4 text-center">
                <User className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-slate-500">No patients yet</p>
                <p className="text-xs mt-1">Patients appear here after a triage is submitted</p>
              </div>
            ) : filtered.map((p, i) => {
              const st = urgencyStatus(p.urgency);
              const StatusIcon = st.icon;
              const isActive = selected?.patient_id === p.patient_id;
              return (
                <div key={p.patient_id} onClick={() => selectPatient(p)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all
                    ${isActive ? 'bg-sky-50 border-l-4 border-sky-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {p.patient_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm truncate max-w-[120px]">{p.patient_id}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${st.cls}`}>
                        <StatusIcon className="w-2.5 h-2.5" />{st.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{p.complaint}</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3" />{relativeDate(p.last_visit)} · {p.visits} visit{p.visits > 1 ? 's' : ''}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-500' : 'text-gray-300'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-sky-300" />
              </div>
              <p className="font-semibold text-slate-600">Select a patient</p>
              <p className="text-sm text-gray-400 mt-1">Click any patient on the left to view records and notes</p>
            </div>
          ) : (
            <>
              {/* Patient Header */}
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-white">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColors[patients.findIndex(p => p.patient_id === selected.patient_id) % avatarColors.length]} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    {selected.patient_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-800 truncate">{selected.patient_id}</h2>
                    <p className="text-sm text-gray-500 truncate">{selected.complaint}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400">Last visit</div>
                    <div className="text-sm font-semibold text-slate-700">{relativeDate(selected.last_visit)}</div>
                    <div className="text-xs text-sky-500 mt-0.5">{selected.visits} visit{selected.visits > 1 ? 's' : ''}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { icon: Stethoscope, label: 'Condition', value: selected.complaint },
                    { icon: FileText,    label: 'Notes',     value: `${notes.length} entr${notes.length === 1 ? 'y' : 'ies'}` },
                    { icon: AlertCircle, label: 'Urgency',   value: selected.urgency },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2">
                      <s.icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
                        <div className="text-xs font-semibold text-slate-700 truncate">{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Follow-up Triage */}
                <div className="mt-4 border border-sky-100 rounded-xl p-4 bg-sky-50/50 space-y-3">
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Follow-up Triage
                  </p>
                  <input ref={followupRef} type="file" accept="image/*" className="hidden"
                    onChange={e => setFollowupFile(e.target.files?.[0] ?? null)} />
                  <div className="flex gap-2">
                    <button onClick={() => followupRef.current?.click()}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        followupFile ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-white border-gray-200 text-gray-500 hover:border-sky-300'}`}>
                      {followupFile ? `✓ ${followupFile.name}` : 'Upload follow-up image'}
                    </button>
                    <button onClick={submitFollowup} disabled={!followupFile || followupLoading}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5">
                      {followupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
                      Analyse
                    </button>
                  </div>
                  <input type="text" placeholder="Current symptoms (optional)"
                    value={followupSymptoms} onChange={e => setFollowupSymptoms(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-400" />
                  {followupResult && (
                    <div className="bg-white rounded-xl p-3 border border-sky-200 space-y-1">
                      <p className="text-xs font-semibold text-sky-700">Progression: {followupResult.progression}</p>
                      <p className="text-xs text-slate-600">{followupResult.comparison_notes}</p>
                      <p className="text-xs text-slate-600"><span className="font-medium">Current:</span> {followupResult.current_impression}</p>
                      <p className="text-xs text-slate-600"><span className="font-medium">Urgency:</span> {followupResult.urgency}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Note */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex gap-2">
                  <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNote()}
                    placeholder="Add clinical note..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent" />
                  <button onClick={addNote} disabled={!newNote.trim() || saving}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-all flex items-center gap-1.5 text-sm font-medium">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-auto p-6 space-y-3">
                {loadingNotes ? (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading notes...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <FileText className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No notes yet — add one above</p>
                  </div>
                ) : notes.map((n, i) => (
                  <div key={n.id ?? i} className="group p-4 bg-gray-50 rounded-xl border-l-4 border-sky-400 hover:bg-sky-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-sky-600">Dr. Akanksha Sharma</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {n.timestamp ? formatNoteDate(n.timestamp) : n.date}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
