import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TriageForm from './components/TriageForm';
import TriageResults from './components/TriageResults';
import PatientHistory from './components/PatientHistory';
import Appointments from './components/Appointments';
import DrugCheck from './components/DrugCheck';
import ExportSummary from './components/ExportSummary';
import { Stethoscope, Calendar, Users, Download, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import apiService from './services/api';

function useIST() {
  const [now, setNow] = useState(() => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })));
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })));
    }, 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

const statsMeta = [
  { label: 'Patients Today',   key: 'patients_today',   sub: (v: number) => v === 1 ? '1 visit today' : `${v} visits today`,      icon: Users,          bg: 'from-sky-500 to-sky-600',     iconBg: 'bg-sky-400/30' },
  { label: 'Pending Triage',   key: 'pending_triage',   sub: (v: number) => v > 0 ? `${v} need attention` : 'All clear',           icon: AlertTriangle,  bg: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-400/30' },
  { label: 'Cases Completed',  key: 'cases_completed',  sub: (_v: number) => 'Total logged cases',                                  icon: CheckCircle,    bg: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-400/30' },
  { label: 'Critical Cases',   key: 'critical_cases',   sub: (v: number) => v > 0 ? 'High urgency — review now' : 'None critical',  icon: TrendingUp,     bg: 'from-rose-500 to-pink-500',    iconBg: 'bg-rose-400/30' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'triage' | 'patients' | 'appointments' | 'drugcheck' | 'export'>('dashboard');
  const [showResults, setShowResults] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);
  const [statsData, setStatsData] = useState<{
    patients_today: number;
    pending_triage: number;
    cases_completed: number;
    critical_cases: number;
    recent_cases: { date: string; primary_impression: string; urgency: string }[];
  }>({ patients_today: 0, pending_triage: 0, cases_completed: 0, critical_cases: 0, recent_cases: [] });
  const [statsLoading, setStatsLoading] = useState(true);
  const ist = useIST();

  useEffect(() => {
    apiService.getStats()
      .then(res => setStatsData(res.data))
      .catch(() => {/* backend offline — keep zeros */})
      .finally(() => setStatsLoading(false));
  }, []);

  const greeting = getGreeting(ist.getHours());
  const dateStr = ist.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeStr = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

  const handleTriageComplete = (result: any) => {
    setTriageResult(result);
    setShowResults(true);
    setCurrentPage('triage');
    apiService.getStats().then(res => setStatsData(res.data)).catch(() => {});
  };
  const handleNewTriage = () => { setShowResults(false); setTriageResult(null); };

  // navigating away from triage clears results
  const navigate = (page: any) => {
    if (page !== 'triage') { setShowResults(false); setTriageResult(null); }
    setCurrentPage(page);
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={navigate}>
      <div className="max-w-7xl mx-auto">

        {currentPage === 'dashboard' && !showResults && (
          <div className="space-y-8">

            {/* Hero Header */}
            <div className="relative bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 rounded-3xl p-8 overflow-hidden shadow-xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white rounded-full translate-y-1/2" />
              </div>
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium uppercase tracking-widest mb-1">{dateStr}</p>
                  <h1 className="text-4xl font-bold text-white">{greeting}, Dr. Akanksha</h1>
                  <p className="text-sky-100 mt-1 text-lg">Panipat Community Health Center</p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => navigate('triage')}
                      className="bg-white text-sky-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-all shadow-sm text-sm"
                    >
                      + New Triage
                    </button>
                    <button
                      onClick={() => navigate('appointments')}
                      className="bg-sky-700/40 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-sky-700/60 transition-all text-sm border border-white/20"
                    >
                      View Schedule
                    </button>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-5xl font-bold text-white">{timeStr}</div>
                  <div className="text-sky-200 text-sm mt-1">IST</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {statsMeta.map((s, i) => {
                const value = statsData[s.key as keyof typeof statsData];
                return (
                  <div key={i} className={`clinical-card bg-gradient-to-br ${s.bg} rounded-2xl p-6 text-white shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/80 text-sm font-medium">{s.label}</p>
                      <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold">
                      {statsLoading ? <span className="text-2xl opacity-60">...</span> : value}
                    </p>
                    <p className="text-white/70 text-xs mt-1">{s.sub(value)}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions + Recent Cases */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Quick Actions */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Quick Actions</h2>
                <button
                  onClick={() => navigate('triage')}
                  className="clinical-card w-full bg-sky-500 hover:bg-sky-600 text-white rounded-2xl p-5 text-left flex items-center gap-4 transition-all shadow-md"
                >
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">New Triage</div>
                    <div className="text-sky-100 text-xs mt-0.5">Image · Symptom · Analysis</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('appointments')}
                  className="clinical-card w-full bg-white hover:border-sky-400 border border-gray-200 rounded-2xl p-5 text-left flex items-center gap-4 transition-all"
                >
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Appointments</div>
                    <div className="text-gray-500 text-xs mt-0.5">Today's Schedule</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('patients')}
                  className="clinical-card w-full bg-white hover:border-sky-400 border border-gray-200 rounded-2xl p-5 text-left flex items-center gap-4 transition-all"
                >
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Patient Records</div>
                    <div className="text-gray-500 text-xs mt-0.5">History & Notes</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('export')}
                  className="clinical-card w-full bg-white hover:border-sky-400 border border-gray-200 rounded-2xl p-5 text-left flex items-center gap-4 transition-all"
                >
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Export Reports</div>
                    <div className="text-gray-500 text-xs mt-0.5">PDF & Summary</div>
                  </div>
                </button>
              </div>

              {/* Recent Cases */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">Recent Cases</h2>
                  <button onClick={() => navigate('patients')} className="text-sky-500 text-sm font-medium hover:text-sky-700">View all →</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {statsLoading ? (
                    <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
                  ) : statsData.recent_cases.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-gray-400">No cases yet — submit a triage to see results here.</div>
                  ) : statsData.recent_cases.map((c, i) => {
                    const urgencyColor =
                      c.urgency === 'High'   ? 'text-rose-600 bg-rose-50' :
                      c.urgency === 'Medium' ? 'text-amber-600 bg-amber-50' :
                                              'text-emerald-600 bg-emerald-50';
                    return (
                      <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-sky-50/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                            {c.primary_impression.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 text-sm">{c.primary_impression}</div>
                            <div className="text-gray-500 text-xs">{c.date}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${urgencyColor}`}>
                          {c.urgency}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'triage' && !showResults && <TriageForm onTriageComplete={handleTriageComplete} />}
        {currentPage === 'triage' && showResults && triageResult && <TriageResults result={triageResult} onNewTriage={handleNewTriage} onSave={() => navigate('patients')} />}
        {currentPage === 'patients' && <PatientHistory />}
        {currentPage === 'notes' && <PatientHistory />}
        {currentPage === 'appointments' && <Appointments />}
        {currentPage === 'drugcheck' && <DrugCheck />}
        {currentPage === 'export' && <ExportSummary />}
      </div>
    </Layout>
  );
}
