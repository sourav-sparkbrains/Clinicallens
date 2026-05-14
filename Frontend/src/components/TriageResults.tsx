import { useState } from 'react';
import {
  Award, AlertTriangle, CheckCircle, ArrowRight, Clock,
  User, Activity, Stethoscope, MessageSquare, ShieldAlert, FileText
} from 'lucide-react';

interface Props {
  result: any;
  onNewTriage: () => void;
  onSave: () => void;
}

const urgencyMeta: Record<string, { bg: string; border: string; text: string }> = {
  emergency: { bg: 'bg-red-50',     border: 'border-red-500',     text: 'text-red-600' },
  urgent:    { bg: 'bg-amber-50',   border: 'border-amber-500',   text: 'text-amber-600' },
  routine:   { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-600' },
};

const confidenceCls: Record<string, string> = {
  high:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-red-100 text-red-700',
};

const TABS = [
  { id: 'overview',   label: 'Overview',        icon: Stethoscope },
  { id: 'treatment',  label: 'Treatment',        icon: CheckCircle },
  { id: 'followup',   label: 'Follow-up',        icon: Clock },
  { id: 'patient',    label: 'Patient Summary',  icon: User },
  { id: 'alerts',     label: 'Alerts',           icon: ShieldAlert },
];

export default function TriageResults({ result, onNewTriage, onSave }: Props) {
  const [tab, setTab] = useState('overview');

  const {
    patient_id = '',
    primary_impression = 'No impression available',
    urgency = 'routine',
    confidence = 'medium',
    recommendation = '',
    differentials = [],
    treatment_suggestions = [],
    follow_up_questions = [],
    visual_observation = '',
    risk_score = 0,
    epidemic_alert = '',
    escalation_warning = '',
    referral = null,
    follow_up = null,
    patient_summary = '',
    disclaimer = 'This report is AI-generated intended to assist a qualified healthcare worker. It is not a substitute for professional medical judgment.',
  } = result;

  const u = urgencyMeta[urgency.toLowerCase()] ?? urgencyMeta.routine;
  const hasAlerts = !!(epidemic_alert || escalation_warning);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg">Clinical Triage Report</h1>
            <p className="text-sky-100 text-xs mt-0.5">ClinicalLens · {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          {patient_id && (
            <div className="text-right flex-shrink-0">
              <p className="text-sky-200 text-[10px] uppercase tracking-wide">Patient ID</p>
              <p className="text-white font-mono text-xs font-semibold truncate max-w-[160px]">{patient_id}</p>
            </div>
          )}
        </div>

        {/* Urgency strip */}
        <div className={`px-6 py-4 flex flex-wrap items-center gap-6 border-l-4 ${u.border} ${u.bg}`}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Urgency</p>
            <p className={`text-2xl font-bold capitalize ${u.text}`}>{urgency}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Risk Score</p>
            <p className="text-2xl font-bold text-slate-800">{risk_score}<span className="text-sm text-gray-400">/100</span></p>
          </div>
          <div className="ml-auto">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${confidenceCls[confidence.toLowerCase()] ?? confidenceCls.medium}`}>
              {confidence} confidence
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            const isAlert = t.id === 'alerts';
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0
                  ${active
                    ? 'border-sky-500 text-sky-600 bg-sky-50/50'
                    : 'border-transparent text-gray-400 hover:text-slate-600 hover:bg-gray-50'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isAlert && hasAlerts ? 'text-red-500' : ''}`} />
                {t.label}
                {isAlert && hasAlerts && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Primary Impression</p>
                <p className="text-lg font-semibold text-slate-800 bg-gray-50 px-5 py-4 rounded-xl">{primary_impression}</p>
              </div>

              {visual_observation && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Visual Observation</p>
                  <p className="text-slate-700 bg-gray-50 px-5 py-4 rounded-xl text-sm leading-relaxed">{visual_observation}</p>
                </div>
              )}

              {differentials.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Differential Diagnosis</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {differentials.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-sky-50 border border-sky-100 px-4 py-3 rounded-xl">
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendation && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-500 mb-1.5">Recommendation</p>
                  <p className="text-slate-800 text-sm leading-relaxed">{recommendation}</p>
                </div>
              )}

              {referral && (
                <div className={`px-5 py-4 rounded-xl border ${referral.needed ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Referral</p>
                  <p className={`font-semibold text-sm capitalize ${referral.needed ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {referral.needed ? `Refer to: ${referral.type}` : 'No referral needed'}
                  </p>
                  {referral.reason && <p className="text-sm text-slate-600 mt-1">{referral.reason}</p>}
                </div>
              )}
            </div>
          )}

          {/* ── TREATMENT ── */}
          {tab === 'treatment' && (
            <div className="space-y-3">
              {treatment_suggestions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No treatment suggestions available.</p>
              ) : treatment_suggestions.map((item: string, i: number) => (
                <div key={i} className="flex gap-3 items-start bg-gray-50 px-5 py-4 rounded-xl border border-gray-100">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── FOLLOW-UP ── */}
          {tab === 'followup' && (
            <div className="space-y-5">
              {follow_up && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Clock,         label: 'Timeline',   value: follow_up.timeline,   color: 'text-sky-500' },
                    { icon: Activity,      label: 'Watch For',  value: follow_up.condition,  color: 'text-amber-500' },
                    { icon: AlertTriangle, label: 'Escalate If',value: follow_up.escalation, color: 'text-red-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {follow_up_questions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Questions to Ask Patient
                  </p>
                  <ul className="space-y-2">
                    {follow_up_questions.map((q: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                        <span className="text-sky-400 font-bold flex-shrink-0">{i + 1}.</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── PATIENT SUMMARY ── */}
          {tab === 'patient' && (
            <div className="space-y-4">
              {patient_summary ? (
                <div className="bg-violet-50 border border-violet-100 rounded-xl px-5 py-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Plain Language Summary
                  </p>
                  <p className="text-slate-700 leading-relaxed text-sm">{patient_summary}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No patient summary available.</p>
              )}
              <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Disclaimer
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{disclaimer}</p>
              </div>
            </div>
          )}

          {/* ── ALERTS ── */}
          {tab === 'alerts' && (
            <div className="space-y-3">
              {!hasAlerts ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <CheckCircle className="w-8 h-8 mb-2 text-emerald-400" />
                  <p className="text-sm">No alerts for this case.</p>
                </div>
              ) : (
                <>
                  {epidemic_alert && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Epidemic Alert</p>
                        <p className="text-sm text-red-700">{epidemic_alert}</p>
                      </div>
                    </div>
                  )}
                  {escalation_warning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3">
                      <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Escalation Warning</p>
                        <p className="text-sm text-amber-700">{escalation_warning}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <button
          onClick={onNewTriage}
          className="flex-1 py-3 border-2 border-sky-500 text-sky-600 rounded-xl font-semibold text-sm hover:bg-sky-50 transition-all"
        >
          New Triage
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-sky-200"
        >
          Save to Patient Record
        </button>
      </div>
    </div>
  );
}
