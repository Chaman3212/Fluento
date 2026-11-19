import { Link } from 'react-router-dom';
import { Mic, Clock, Flame, ListChecks, ArrowRight, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { dashApi } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ScoreRing, ScoreBar, Skeleton, EmptyState, ErrorState, StatusBadge } from '../components/ui.jsx';
import { fmtMinutes, fmtDateTime, TYPE_LABELS } from '../utils/format.js';

const GOAL_LINE = 80;
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(dashApi.overview, []);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-52" /><Skeleton className="h-64" /></div>;

  if (data.totalSessions === 0) return (
    <div className="space-y-6">
      <Header name={user.name} />
      <EmptyState icon={Mic} title="Your journey starts here" text="Record your first speaking answer and Fluento will analyze your grammar, vocabulary and fluency."
        action={<Link to="/studio" className="btn-primary">Start Practicing <ArrowRight className="h-4 w-4" /></Link>} />
    </div>
  );
  const a = data.averages;
  return (
    <div className="space-y-6">
      <Header name={user.name} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2" aria-label="Score summary">
          <div className="flex items-center justify-between gap-4">
            <div><p className="eyebrow !text-muted">Average overall score</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">{a.overall ?? '–'}<span className="ml-1 font-mono text-sm font-medium text-muted">/ 100</span></p>
              <p className="mt-1 text-sm text-muted">Latest session: <b className="text-ink">{data.latestScore ?? '–'}</b></p></div>
            <ScoreRing value={a.overall} size={92} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <ScoreBar label="Fluency" value={a.fluency} /><ScoreBar label="Grammar" value={a.grammar} />
            <ScoreBar label="Vocabulary" value={a.vocabulary} /><ScoreBar label="Clarity" value={a.clarity} />
          </div>
          <p className="mt-3 text-[11px] text-muted">Pronunciation isn’t scored: it can’t be reliably measured from a transcript.</p>
        </section>
        <section className="grid grid-cols-3 gap-3 lg:grid-cols-1" aria-label="Activity">
          <Stat icon={ListChecks} value={data.totalSessions} label="Sessions" />
          <Stat icon={Clock} value={fmtMinutes(data.totalSpeakingSeconds)} label="Speaking time" />
          <Stat icon={Flame} value={`${data.streakDays}d`} label="Current streak" />
        </section>
      </div>

      <section className="card p-5" aria-label="Weekly progress">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Weekly progress</h2><p className="text-xs text-muted">Average score per day · goal {GOAL_LINE}</p></div></div>
        <div className="mt-4 h-44">
          <ResponsiveContainer>
            <BarChart data={data.weeklyChart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip cursor={{ fill: '#f2f3ff' }} formatter={(v) => (v == null ? 'No session' : v)} />
              <ReferenceLine y={GOAL_LINE} stroke="#006058" strokeDasharray="4 4" />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>{data.weeklyChart.map((d, i) => <Cell key={i} fill={d.score >= GOAL_LINE ? '#2563eb' : '#b4c5ff'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent sessions</h2><Link to="/history" className="text-sm font-semibold text-brand-dark">View all</Link></div>
          <ul className="mt-3 divide-y divide-line">
            {data.recentSessions.map((s) => (
              <li key={s._id}><Link to={`/feedback/${s._id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{s.topic || TYPE_LABELS[s.practiceType]}</p><p className="font-mono text-[11px] text-muted">{fmtDateTime(s.createdAt)}</p></div>
                {s.status === 'COMPLETED' ? <span className="font-mono text-lg font-bold text-brand-dark">{s.evaluation?.overallScore}</span> : <StatusBadge status={s.status} />}
              </Link></li>))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-4 w-4 text-brand" />Recommended next</h2>
          {data.recommendedNext.length ? <ul className="mt-3 space-y-2">{data.recommendedNext.map((t) => (
            <li key={t}><Link to={`/studio?topic=${encodeURIComponent(t)}`} className="flex items-center justify-between rounded-xl bg-brand-wash px-3.5 py-3 text-sm font-semibold hover:bg-brand-soft">{t}<ArrowRight className="h-4 w-4 text-brand" /></Link></li>))}</ul>
            : <p className="mt-3 text-sm text-muted">Complete a session to get topic suggestions based on your results.</p>}
          <Link to="/improve" className="btn-secondary mt-4 w-full">Open Improvement Center</Link>
        </section>
      </div>
    </div>
  );
}
const Header = ({ name }) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {name.split(' ')[0]}</h1><p className="text-muted">Ready for today’s speaking practice?</p></div>
    <Link to="/studio" className="btn-primary"><Mic className="h-4 w-4" />Start a session</Link>
  </div>
);
const Stat = ({ icon: Icon, value, label }) => (
  <div className="card p-3.5 lg:flex lg:items-center lg:gap-3"><Icon className="h-4 w-4 text-brand-dark" /><div><p className="text-xl font-bold leading-tight">{value}</p><p className="font-mono text-[11px] text-muted">{label}</p></div></div>
);
