import { useState, useEffect } from 'react';
import { Menu, X, Home, Stethoscope, Users, FileText, Calendar, Download, Activity, Pill } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Dashboard', id: 'dashboard' },
  { icon: Stethoscope, label: 'New Triage', id: 'triage' },
  { icon: Users, label: 'Patients', id: 'patients' },
  { icon: Calendar, label: 'Appointments', id: 'appointments' },
  { icon: FileText, label: 'Notes', id: 'notes' },
  { icon: Pill, label: 'Drug Check', id: 'drugcheck' },
  { icon: Download, label: 'Export', id: 'export' },
];

// Unique ClinicalLens logo: stylized eye with a medical cross as the pupil
function CLLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Eye outline */}
      <path
        d="M4 22 C10 10, 34 10, 40 22 C34 34, 10 34, 4 22 Z"
        fill="#0EA5E9"
        stroke="#0284C7"
        strokeWidth="1.5"
      />
      {/* Iris */}
      <circle cx="22" cy="22" r="7" fill="white" opacity="0.95" />
      {/* Medical cross pupil */}
      <rect x="20" y="16" width="4" height="12" rx="1.5" fill="#0EA5E9" />
      <rect x="16" y="20" width="12" height="4" rx="1.5" fill="#0EA5E9" />
      {/* Highlight */}
      <circle cx="26" cy="18" r="1.5" fill="white" opacity="0.7" />
    </svg>
  );
}

function useISTTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function Layout({ children, currentPage, setCurrentPage }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const time = useISTTime();

  return (
    <div className="min-h-screen flex bg-[#F0F7FF]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} bg-[#0F172A] text-white transition-all duration-300 flex flex-col shadow-2xl flex-shrink-0`}>

        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="flex-shrink-0">
            <CLLogo size={40} />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-lg tracking-tight leading-tight">ClinicalLens</div>
              <div className="text-sky-400 text-[11px] mt-0.5 font-medium tracking-wide">Clinical Decision Support</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150
                ${currentPage === item.id
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-sky-400 flex-shrink-0" />
            {sidebarOpen && <span className="text-slate-500 text-xs">v1.0 · IST {time}</span>}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-sky-50 rounded-lg text-slate-500 hover:text-sky-600 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="font-semibold text-slate-800 text-sm">Dr. Akanksha Sharma</div>
              <div className="text-xs text-sky-500">Panipat · Haryana</div>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md">
              AS
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
