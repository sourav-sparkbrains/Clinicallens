import { useState } from 'react';
import { AlertTriangle, Search, Pill, Plus, X, CheckCircle, Loader2 } from 'lucide-react';
import apiService from '../services/api';

const inputCls = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent';

export default function DrugCheck() {
  const [patientId, setPatientId] = useState('');
  const [medications, setMedications] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const updateMed = (i: number, val: string) => {
    const updated = [...medications];
    updated[i] = val;
    setMedications(updated);
  };

  const removeMed = (i: number) => setMedications(medications.filter((_, idx) => idx !== i));

  const check = async () => {
    const valid = medications.filter(d => d.trim());
    if (!patientId.trim()) { setError('Patient ID is required'); return; }
    if (valid.length < 2) { setError('Enter at least 2 medications'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await apiService.drugCheck(patientId.trim(), valid);
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Drug check failed — check server logs');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
          <Pill className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Drug Interaction Checker</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check medications against suggested treatments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Patient ID */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
            Patient ID <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="Enter patient ID"
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Must match a patient who has a completed triage on file</p>
        </div>

        {/* Medications */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
            Current Medications
          </label>
          <div className="space-y-2">
            {medications.map((med, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  className={inputCls}
                  placeholder={`Medication ${i + 1}`}
                  value={med}
                  onChange={e => updateMed(i, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setMedications([...medications, ''])}
                />
                {medications.length > 2 && (
                  <button
                    onClick={() => removeMed(i)}
                    className="p-2.5 hover:bg-rose-50 rounded-xl transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-rose-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setMedications([...medications, ''])}
            className="mt-2 flex items-center gap-1.5 text-sky-500 hover:text-sky-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add medication
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <button
          onClick={check}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-semibold text-sm transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Checking...' : 'Check Interactions'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={`bg-white rounded-2xl border shadow-sm p-6 space-y-4 ${result.interactions_found ? 'border-rose-200' : 'border-emerald-200'}`}>
          <div className="flex items-center gap-2">
            {result.interactions_found
              ? <AlertTriangle className="w-5 h-5 text-rose-500" />
              : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <h3 className={`font-bold text-lg ${result.interactions_found ? 'text-rose-700' : 'text-emerald-700'}`}>
              {result.interactions_found ? 'Interactions Found' : 'No Interactions Found'}
            </h3>
          </div>

          {result.warning && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
              {result.warning}
            </div>
          )}

          {result.flagged_pairs?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Flagged Pairs</p>
              <div className="space-y-2">
                {result.flagged_pairs.map((pair: any, i: number) => (
                  <div key={i} className="bg-rose-50 rounded-xl px-4 py-3 text-sm text-rose-800 border border-rose-100">
                    {typeof pair === 'string' ? pair : JSON.stringify(pair)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.safe_treatments?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safe Treatments</p>
              <div className="flex flex-wrap gap-2">
                {result.safe_treatments.map((t: string, i: number) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
