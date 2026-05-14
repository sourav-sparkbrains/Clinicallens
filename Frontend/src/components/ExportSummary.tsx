import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

const LANGUAGES = [
  'english', 'hindi', 'marathi', 'bengali', 'tamil', 'telugu',
  'kannada', 'malayalam', 'gujarati', 'punjabi', 'odia', 'assamese',
  'urdu', 'nepali', 'spanish', 'french', 'german', 'portuguese', 'italian',
];

export default function ExportSummary() {
  const [patientId, setPatientId] = useState('');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const downloadSummaryPdf = async () => {
    if (!patientId.trim()) return alert('Please enter Patient ID');
    setLoading(true);
    try {
      const params = language !== 'english' ? `?language=${language}` : '';
      const res = await axios.get(`${API_BASE}/triage/summary/${patientId}${params}`, {
        responseType: 'blob',
        timeout: 180000,
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case_summary_${patientId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Patient not found or no visits recorded yet.');
    }
    setLoading(false);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API_BASE}/triage/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ClinicalLens_Export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Export failed — no cases found or server unavailable.');
    }
    setExporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Export & Summary</h1>
          <p className="text-sm text-gray-500 mt-0.5">Download patient PDF reports and anonymized case data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Patient PDF Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500" /> Patient Case Summary (PDF)
          </h2>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Patient ID</label>
            <input
              type="text"
              placeholder="Enter patient ID"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
              Report Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent capitalize"
            >
              {LANGUAGES.map(l => (
                <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadSummaryPdf}
            disabled={loading || !patientId.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl font-semibold text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Generating PDF...' : 'Download PDF Summary'}
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Export All Cases (CSV)
          </h2>
          <p className="text-sm text-gray-500">
            Download anonymized triage records for research or analysis. Contains date, condition, urgency, and treatment data — no patient identifiers.
          </p>
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl font-semibold text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
