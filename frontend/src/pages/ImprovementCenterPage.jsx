import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Sparkles, Check } from 'lucide-react';
import { improvementApi, errorMessage } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { Skeleton, EmptyState, ErrorState, Spinner } from '../components/ui.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPE_STYLE = { grammar: 'bg-amber-100 text-amber-900', vocabulary: 'bg-violet-100 text-violet-900', speaking: 'bg-brand-tint text-brand-dark', interview: 'bg-sky-100 text-sky-900', fluency: 'bg-mint text-mint-ink', sentence: 'bg-rose-100 text-rose-900' };

export default function ImprovementCenterPage() {
  const toast = useToast();
  const { data: loaded, loading, error, reload } = useAsync(improvementApi.get, []);
  const [override, setOverride] = useState(null); const [busy, setBusy] = useState(false);
  const plan = override || loaded;

  async function generate() {
    setBusy(true);
    try { setOverride(await improvementApi.generate()); toast.success('Your new weekly plan is ready'); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  async function toggle(t) {
    try { setOverride(await improvementApi.toggle(t._id, !t.completed)); } catch (e) { toast.error(errorMessage(e)); }
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <Skeleton className="h-72" />;
  const done = plan?.completionStatus?.completed || 0; const total = plan?.completionStatus?.total || 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Improvement Center</h1><p className="text-muted">A weekly plan built from your own practice results.</p></div>
        <button className="btn-primary" onClick={generate} disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{plan ? 'Regenerate plan' : 'Generate my plan'}</button>
      </div>
      {!plan ? (
        <EmptyState icon={Target} title="No plan yet" text="Complete at least one practice session, then generate a personalized weekly plan based on your mistakes and weakest skills."
          action={<Link to="/studio" className="btn-secondary">Go to Studio</Link>} />
      ) : (
        <>
          <section className="card p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Goals</h2><span className="font-mono text-sm font-bold">{done}/{total} done</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-soft"><div className="h-full bg-brand transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
            <ul className="mt-4 space-y-1.5">{plan.goals.map((g) => <li key={g} className="flex gap-2 text-sm"><Target className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{g}</li>)}</ul>
            {plan.recommendations.length > 0 && <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">{plan.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>}</section>
          <div className="grid gap-4 md:grid-cols-2">
            {DAYS.map((day, i) => {
              const tasks = plan.tasks.filter((t) => t.dayOfWeek === i); if (!tasks.length) return null;
              return (
                <section key={day} className="card p-5"><h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">{day}</h3>
                  <ul className="mt-3 space-y-3">{tasks.map((t) => (
                    <li key={t._id} className="flex gap-3">
                      <button onClick={() => toggle(t)} role="checkbox" aria-checked={t.completed} aria-label={`Mark "${t.title}" ${t.completed ? 'incomplete' : 'complete'}`}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${t.completed ? 'border-brand bg-brand text-white' : 'border-line'}`}>{t.completed && <Check className="h-3.5 w-3.5" />}</button>
                      <div className={t.completed ? 'opacity-60' : ''}><p className={`text-sm font-semibold ${t.completed ? 'line-through' : ''}`}>{t.title}</p>
                        <p className="text-[13px] leading-5 text-muted">{t.description}</p>
                        <div className="mt-1.5 flex items-center gap-2"><span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold capitalize ${TYPE_STYLE[t.type]}`}>{t.type}</span><span className="font-mono text-[11px] text-muted">{t.estimatedMinutes} min</span>
                          {['speaking', 'interview', 'fluency'].includes(t.type) && <Link to={`/studio?topic=${encodeURIComponent(t.title)}`} className="text-[11px] font-semibold text-brand-dark">Practice →</Link>}</div></div>
                    </li>))}</ul></section>);
            })}
          </div>
        </>
      )}
    </div>
  );
}
