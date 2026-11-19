import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { BarChart3, Trophy, AlertTriangle, CalendarCheck, TrendingUp } from 'lucide-react';
import { dashApi } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { Skeleton, EmptyState, ErrorState } from '../components/ui.jsx';
import { fmtDate, fmtMinutes } from '../utils/format.js';

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '–');
const delta = (n) => (n == null ? '–' : `${n > 0 ? '+' : ''}${n}`);

export default function ReportPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useAsync(() => dashApi.analytics(days), [days]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Progress Report</h1><p className="text-muted">How your speaking is changing over time.</p></div>
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-card" role="group" aria-label="Date range">
          {RANGES.map(([d, l]) => <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${days === d ? 'bg-brand text-white' : 'text-muted hover:bg-brand-soft'}`}>{l}</button>)}
        </div>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-72" /></div> : data.series.length === 0 ? (
        <EmptyState icon={BarChart3} title="No completed sessions in this period" text="Finish a practice session to start tracking your progress." action={<Link to="/studio" className="btn-primary">Start Practicing</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={TrendingUp} label="Overall change" value={delta(data.improvement.overall)} sub="first half vs second half" />
            <Kpi icon={Trophy} label="Best session" value={data.bestSession.score} sub={fmtDate(data.bestSession.date)} />
            <Kpi icon={AlertTriangle} label="Weakest skill" value={cap(data.weakestCategory)} sub={`Strongest: ${cap(data.strongestCategory)}`} />
            <Kpi icon={CalendarCheck} label="Consistency" value={`${data.consistency.percent}%`} sub={`${data.consistency.activeDays} active days · ${data.sessionsPerWeek}/wk`} />
          </div>
          <section className="card p-5"><h2 className="text-lg font-semibold">Score trend</h2>
            <div className="mt-4 h-72"><ResponsiveContainer><LineChart data={data.series.map((s) => ({ ...s, d: fmtDate(s.date) }))} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="#eaedff" vertical={false} /><XAxis dataKey="d" fontSize={11} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Legend />
              <Line type="monotone" dataKey="overall" name="Overall" stroke="#2563eb" strokeWidth={3} dot />
              <Line type="monotone" dataKey="fluency" name="Fluency" stroke="#006058" dot={false} />
              <Line type="monotone" dataKey="grammar" name="Grammar" stroke="#f59e0b" dot={false} />
              <Line type="monotone" dataKey="vocabulary" name="Vocabulary" stroke="#8b5cf6" dot={false} />
            </LineChart></ResponsiveContainer></div></section>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5"><h2 className="text-lg font-semibold">Skill improvement</h2>
              <ul className="mt-3 space-y-3">{[['Fluency', 'fluency'], ['Grammar', 'grammar'], ['Vocabulary', 'vocabulary']].map(([l, k]) => (
                <li key={k} className="flex items-center justify-between rounded-xl bg-brand-wash px-4 py-3 text-sm"><span className="font-semibold">{l}</span>
                  <span className="font-mono"><span className="text-muted">avg {data.categoryAverages[k]}</span> · <b className={data.improvement[k] > 0 ? 'text-mint-dark' : data.improvement[k] < 0 ? 'text-red-600' : ''}>{delta(data.improvement[k])}</b></span></li>))}</ul></section>
            <section className="card p-5"><h2 className="text-lg font-semibold">Weekly activity</h2><p className="text-xs text-muted">{fmtMinutes(data.totalSpeakingSeconds)} spoken in total</p>
              <div className="mt-3 h-44"><ResponsiveContainer><BarChart data={data.weekly.map((w) => ({ ...w, w: fmtDate(w.week) }))} margin={{ left: -24, right: 8 }}>
                <XAxis dataKey="w" fontSize={11} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="sessions" name="Sessions" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
          </div>
        </>
      )}
    </div>
  );
}
const Kpi = ({ icon: Icon, label, value, sub }) => (
  <div className="card p-4"><Icon className="h-4 w-4 text-brand-dark" /><p className="mt-2 text-2xl font-bold">{value}</p><p className="font-mono text-[11px] font-semibold text-muted">{label}</p><p className="mt-0.5 text-[11px] text-muted">{sub}</p></div>
);
