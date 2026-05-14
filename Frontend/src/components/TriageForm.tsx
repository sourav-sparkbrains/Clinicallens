import { useState, useRef, useEffect } from 'react';
import { Stethoscope, Send, Mic, Video, ImageIcon, X, CheckCircle, User, FileText, Upload, Loader2, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import apiService from '../services/api';

interface TriageFormProps {
  onTriageComplete?: (result: any) => void;
}

function DropZone({
  label, icon: Icon, accept, file, preview, onFile, onClear, sizeLimit, formats,
}: {
  label: string; icon: any; accept: string; file: File | null;
  preview?: string | null; onFile: (f: File) => void; onClear: () => void;
  sizeLimit?: string; formats?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const fileSizeKB = file ? (file.size / 1024) : 0;
  const fileSizeMB = fileSizeKB / 1024;
  const fileSizeDisplay = fileSizeMB >= 1
    ? `${fileSizeMB.toFixed(1)} MB`
    : `${fileSizeKB.toFixed(0)} KB`;

  return (
    <div
      onClick={() => !file && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden
        ${file
          ? 'border-sky-400 bg-sky-50'
          : drag
            ? 'border-sky-400 bg-sky-50 scale-[1.01]'
            : 'border-dashed border-gray-200 bg-gray-50 hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer'
        }`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

      {file ? (
        <div className="p-4">
          {preview ? (
            <img src={preview} alt="preview" className="w-full max-h-52 object-cover rounded-xl" />
          ) : (
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{fileSizeDisplay}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-sky-500 flex-shrink-0" />
            </div>
          )}
          {preview && (
            <p className="text-xs text-gray-400 mt-2 text-center">{file.name} · {fileSizeDisplay}</p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
          >
            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-3">
            <Icon className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-xs text-gray-400 mt-1">Drag & drop or <span className="text-sky-500">browse</span></p>
          {(formats || sizeLimit) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
              {formats && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{formats}</span>}
              {sizeLimit && <span className="text-[10px] bg-rose-50 text-rose-400 px-2 py-0.5 rounded-full font-medium">Max {sizeLimit}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all";

export default function TriageForm({ onTriageComplete }: TriageFormProps) {
  const [formData, setFormData] = useState({ patient_name: '', age: 30, gender: 'Male', symptoms: '', medical_history: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('PAT_01');

  // fetch current patient count to generate next sequential ID
  useEffect(() => {
    apiService.getPatientCount()
      .then(res => {
        const next = res.data.count + 1;
        setPatientId(`PAT_${String(next).padStart(2, '0')}`);
      })
      .catch(() => setPatientId('PAT_01'));
  }, []);
  // prescreen
  const [showPrescreen, setShowPrescreen] = useState(false);
  const [prescreenForm, setPrescreenForm] = useState({ age: 30, duration: '', has_fever: false, is_spreading: false, symptoms: '' });
  const [prescreenResult, setPrescreenResult] = useState<any>(null);
  const [prescreenLoading, setPrescreenLoading] = useState(false);
  const [prescreenId, setPrescreenId] = useState<string | null>(null);

  const set = (k: string, v: any) => setFormData(p => ({ ...p, [k]: v }));
  const setPs = (k: string, v: any) => setPrescreenForm(p => ({ ...p, [k]: v }));

  const handleImage = (f: File) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); };
  const clearImage = () => { setImageFile(null); setImagePreview(null); };

  const runPrescreen = async () => {
    if (!prescreenForm.symptoms.trim()) return;
    setPrescreenLoading(true);
    try {
      const res = await apiService.prescreen(prescreenForm);
      setPrescreenResult(res.data);
      setPrescreenId(res.data.prescreen_id);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Prescreen failed');
    }
    setPrescreenLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.patient_name.trim()) { alert('Patient name is required'); return; }
    setLoading(true);
    const data = new FormData();
    data.append('patient_id', patientId);
    data.append('symptoms', formData.symptoms);
    if (prescreenId) data.append('prescreen_id', prescreenId);
    if (imageFile) data.append('file', imageFile);
    if (audioFile) data.append('audio', audioFile);
    if (videoFile) data.append('video', videoFile);
    try {
      const res = await apiService.createTriage(data);
      onTriageComplete?.(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const mediaCount = [imageFile, audioFile, videoFile].filter(Boolean).length;
  const isReady = formData.patient_name.trim() && !!imageFile;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Triage Assessment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload clinical media and fill patient details for analysis</p>
        </div>
      </div>

      {/* Progress pills */}
      <div className="flex items-center gap-2">
        {[
          { label: 'Media', done: mediaCount > 0 },
          { label: 'Patient Info', done: !!formData.patient_name.trim() },
          { label: 'Symptoms', done: !!formData.symptoms.trim() },
        ].map((step, i) => (
          <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${step.done ? 'bg-sky-500 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
            {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{i + 1}</span>}
            {step.label}
          </div>
        ))}
      </div>

      {/* Prescreen Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowPrescreen(p => !p)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-sky-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-slate-800 text-sm">Pre-Screening</span>
            <span className="text-xs text-gray-400 ml-1">(optional — run before uploading image)</span>
            {prescreenResult && <span className="text-xs bg-sky-100 text-sky-600 font-medium px-2 py-0.5 rounded-full">Done ✓</span>}
          </div>
          {showPrescreen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showPrescreen && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Age</label>
                <input type="number" className={inputCls} value={prescreenForm.age}
                  onChange={e => setPs('age', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Duration</label>
                <input type="text" className={inputCls} placeholder="e.g. 3 days" value={prescreenForm.duration}
                  onChange={e => setPs('duration', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={prescreenForm.has_fever} onChange={e => setPs('has_fever', e.target.checked)}
                  className="w-4 h-4 accent-sky-500" />
                Has Fever
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={prescreenForm.is_spreading} onChange={e => setPs('is_spreading', e.target.checked)}
                  className="w-4 h-4 accent-sky-500" />
                Is Spreading
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Symptoms</label>
              <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Brief symptom description..."
                value={prescreenForm.symptoms} onChange={e => setPs('symptoms', e.target.value)} />
            </div>
            <button onClick={runPrescreen} disabled={prescreenLoading || !prescreenForm.symptoms.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition-all">
              {prescreenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              {prescreenLoading ? 'Running...' : 'Run Pre-Screen'}
            </button>

            {prescreenResult && (
              <div className="bg-sky-50 rounded-xl p-4 space-y-2 border border-sky-100">
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Pre-Screen Result</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Urgency hint:</span> {prescreenResult.urgency_hint}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Suspected:</span> {prescreenResult.suspected_conditions?.join(', ')}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Capture areas:</span> {prescreenResult.suggested_image_areas?.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT — Media Upload */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-sky-500" />
            <h2 className="font-semibold text-slate-800">Clinical Media</h2>
            {mediaCount > 0 && (
              <span className="ml-auto text-xs bg-sky-100 text-sky-600 font-medium px-2 py-0.5 rounded-full">{mediaCount} file{mediaCount > 1 ? 's' : ''}</span>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
              Skin / Affected Area Image <span className="text-rose-400">*</span>
            </label>
            <DropZone
              label="Drag & drop or browse"
              icon={ImageIcon}
              accept="image/*"
              file={imageFile}
              preview={imagePreview}
              onFile={handleImage}
              onClear={clearImage}
              formats="JPG · PNG · WEBP"
              sizeLimit="5 MB"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
              Audio — Patient Disease Description <span className="text-gray-300">(optional)</span>
            </label>
            <DropZone
              label="Drag & drop or browse"
              icon={Mic}
              accept="audio/*"
              file={audioFile}
              preview={null}
              onFile={setAudioFile}
              onClear={() => setAudioFile(null)}
              formats="MP3 · WAV · M4A · OGG · AAC"
              sizeLimit="10 MB"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
              Video Recording of Disease<span className="text-gray-300">(optional)</span>
            </label>
            <DropZone
              label="Drag & drop or browse"
              icon={Video}
              accept="video/*"
              file={videoFile}
              preview={null}
              onFile={setVideoFile}
              onClear={() => setVideoFile(null)}
              formats="MP4 · MOV · AVI · MKV · WEBM"
              sizeLimit="50 MB"
            />
          </div>

        </div>

        {/* RIGHT — Clinical Details */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-sky-500" />
            <h2 className="font-semibold text-slate-800">Patient Details</h2>
            <span className="ml-auto text-xs font-mono bg-sky-50 border border-sky-200 text-sky-700 px-2.5 py-1 rounded-lg font-semibold">
              {patientId}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
              Patient Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="Full name"
              value={formData.patient_name}
              onChange={(e) => set('patient_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Age</label>
              <input
                type="number"
                className={inputCls}
                value={formData.age}
                onChange={(e) => set('age', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Gender</label>
              <select className={inputCls} value={formData.gender} onChange={(e) => set('gender', e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chief Complaint / Symptoms</label>
            </div>
            <textarea
              rows={4}
              className={inputCls + ' resize-none'}
              placeholder="Describe symptoms, duration, pain level, affected area..."
              value={formData.symptoms}
              onChange={(e) => set('symptoms', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Medical History</label>
            <textarea
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Allergies, chronic conditions, current medications..."
              value={formData.medical_history}
              onChange={(e) => set('medical_history', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
        <div className="text-sm text-gray-500">
          {isReady
            ? <span className="text-sky-600 font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Ready to submit</span>
            : 'Patient name and a skin image are required to proceed'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !isReady}
          className={`flex items-center gap-2.5 px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-md
            ${isReady && !loading
              ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200 hover:shadow-sky-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Analysing with Gemma-4...' : 'Run Triage Analysis'}
        </button>
      </div>
    </div>
  );
}
