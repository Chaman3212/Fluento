import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, Volume2, Info } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { practiceApi, errorMessage } from '../api/client.js';
import { ScoreRing, ScoreBar, Skeleton, ErrorState, StatusBadge, Spinner } from '../components/ui.jsx';
import { fmtDateTime, TYPE_LABELS, fmtDuration } from '../utils/format.js';

const STAGES = [['UPLOADED', 'Uploaded'], ['QUEUED', 'Queued'], ['TRANSCRIBING', 'Transcribing'], ['EVALUATING', 'Evaluating'], ['COMPLETED', 'Done']];

export default function FeedbackPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null); const [status, setStatus] = useState(null); const [error, setError] = useState(null); const [procError, setProcError] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true; let delay = 1500;
    async function load() { try { const s = await practiceApi.get(id); if (alive) { setSession(s); setStatus(s.status); setProcError(s.error?.message || null); } return s; } catch (e) { if (alive) setError(errorMessage(e, 'Session not found')); return null; } }
    async function poll() {
      try {
        const st = await practiceApi.status(id);
        if (!alive) return;
        setStatus(st.status); setProcError(st.error);
        if (st.status === 'COMPLETED') return void load();
        if (st.status === 'FAILED') return void load();
        delay = Math.min(delay * 1.2, 5000); timer.current = setTimeout(poll, delay);
      } catch (e) { if (alive) setError(errorMessage(e)); }
    }
    load().then((s) => { if (s && !['COMPLETED', 'FAILED'].includes(s.status)) poll(); });
    return () => { alive = false; clearTimeout(timer.current); };
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!session) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  if (status !== 'COMPLETED') {
    const failed = status === 'FAILED'; const idx = STAGES.findIndex(([s]) => s === status);
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center" role="status" aria-live="polite">
          {failed ? <AlertTriangle className="mx-auto h-10 w-10 text-red-600" /> : <Spinner className="mx-auto h-10 w-10 text-brand" />}
          <h1 className="mt-4 text-xl font-bold">{failed ? 'We couldn’t analyze this recording' : 'Analyzing your speech…'}</h1>
          <p className="mt-1 text-sm text-muted">{failed ? (procError || 'Something went wrong while processing.') : 'This usually takes under a minute. You can leave this page and come back from History.'}</p>
          {!failed && <ol className="mt-6 flex items-center justify-center gap-1.5">{STAGES.map(([s, label], i) => (
            <li key={s} className="flex flex-col items-center gap-1"><span className={`h-2 w-10 rounded-full ${i <= idx ? 'bg-brand' : 'bg-brand-soft'}`} /><span className="hidden font-mono text-[10px] text-muted sm:block">{label}</span></li>))}</ol>}
          {failed && <Link to="/studio" className="btn-primary mt-6">Try another recording</Link>}
        </div>
      </div>
    );
  }

  const e = session.evaluation; const m = e.deliveryMetrics || {};
  const radar = [['Fluency', e.fluencyScore], ['Grammar', e.grammarScore], ['Vocabulary', e.vocabularyScore], ['Clarity', e.clarityScore], ['Sentences', e.sentenceConstructionScore], ['Relevance', e.relevanceScore]].map(([k, v]) => ({ k, v }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="eyebrow">{TYPE_LABELS[session.practiceType]} · {session.difficulty}</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{session.topic || 'Your speaking feedback'}</h1>
          <p className="font-mono text-xs text-muted">{fmtDateTime(session.createdAt)} · {fmtDuration(session.duration)}</p></div>
        <StatusBadge status="COMPLETED" />
      </div>

      <section className="card grid gap-6 p-5 md:grid-cols-[auto_1fr_1fr] md:items-center">
        <div className="flex items-center gap-4"><ScoreRing value={e.overallScore} size={110} stroke={10} /><div><p className="eyebrow !text-muted">Overall</p><p className="text-sm text-muted">out of 100</p></div></div>
        <div className="space-y-3"><ScoreBar label="Fluency" value={e.fluencyScore} /><ScoreBar label="Grammar" value={e.grammarScore} /><ScoreBar label="Vocabulary" value={e.vocabularyScore} />
          <ScoreBar label="Clarity" value={e.clarityScore} /><ScoreBar label="Pronunciation" value={null} note="Not measured: transcript-based analysis can’t judge pronunciation." /></div>
        <div className="h-52" aria-hidden><ResponsiveContainer><RadarChart data={radar}><PolarGrid stroke="#dfe3f5" /><PolarAngleAxis dataKey="k" fontSize={11} /><Radar dataKey="v" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} /></RadarChart></ResponsiveContainer></div>
      </section>

      <section className="card p-5"><h2 className="text-lg font-semibold">Summary</h2><p className="mt-2 leading-7">{e.summary}</p>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-wash p-3 text-xs text-muted"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />Scores are AI coaching estimates based on your transcript, not an official language proficiency score.</div></section>

      <section className="card p-5"><h2 className="text-lg font-semibold">Measured from your audio</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Pace', m.wordsPerMinute != null ? `${m.wordsPerMinute} wpm` : '–'], ['Words', m.wordCount ?? '–'], ['Pauses (≥0.7s)', m.hasWordTimestamps ? m.pauseCount : '–'], ['Filler words', m.fillerWordCount ?? '–']].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-brand-wash p-3"><dt className="font-mono text-[11px] font-semibold text-muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>))}
        </dl></section>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Strengths" items={e.strengths} icon={<CheckCircle2 className="h-4 w-4 text-mint-dark" />} />
        <ListCard title="Areas to improve" items={e.weaknesses} icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} />
      </div>

      <section className="card p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Transcript</h2>
        <audio controls src={practiceApi.audioUrl(id)} className="h-9 max-w-[220px]" aria-label="Play your recording" /></div>
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-brand-wash p-4 text-[15px] leading-7">{session.transcript}</p></section>

      <Corrections title="Grammar corrections" empty="No grammar mistakes detected. Nice work!" rows={e.grammarMistakes.map((g) => [g.original, g.corrected, g.explanation])} />
      <Corrections title="Sentence improvements" empty="Your sentences were already strong." rows={e.sentenceImprovements.map((g) => [g.original, g.improved, g.explanation])} />
      <section className="card p-5"><h2 className="text-lg font-semibold">Vocabulary suggestions</h2>
        {e.vocabularySuggestions.length ? <ul className="mt-3 divide-y divide-line">{e.vocabularySuggestions.map((v, i) => (
          <li key={i} className="py-3 text-sm"><span className="text-muted line-through">{v.original}</span> <ArrowRight className="mx-1 inline h-3.5 w-3.5" /> <b className="text-brand-dark">{v.suggestion}</b><p className="mt-0.5 text-muted">{v.reason}</p></li>))}</ul>
          : <p className="mt-2 text-sm text-muted">No vocabulary changes suggested.</p>}</section>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Recommendations" items={e.recommendations} icon={<Volume2 className="h-4 w-4 text-brand" />} />
        <section className="card p-5"><h2 className="text-lg font-semibold">Next practice topics</h2><ul className="mt-3 space-y-2">{e.nextPracticeTopics.map((t) => (
          <li key={t}><Link to={`/studio?topic=${encodeURIComponent(t)}`} className="flex items-center justify-between rounded-xl bg-brand-wash px-3.5 py-3 text-sm font-semibold hover:bg-brand-soft">{t}<ArrowRight className="h-4 w-4 text-brand" /></Link></li>))}</ul></section>
      </div>
    </div>
  );
}
const ListCard = ({ title, items, icon }) => (
  <section className="card p-5"><h2 className="text-lg font-semibold">{title}</h2><ul className="mt-3 space-y-2.5">{items.length ? items.map((t, i) => <li key={i} className="flex gap-2 text-sm leading-6"><span className="mt-1 shrink-0">{icon}</span>{t}</li>) : <li className="text-sm text-muted">Nothing to show.</li>}</ul></section>
);
const Corrections = ({ title, rows, empty }) => (
  <section className="card p-5"><h2 className="text-lg font-semibold">{title}</h2>
    {rows.length ? <ul className="mt-3 space-y-3">{rows.map(([a, b, why], i) => (
      <li key={i} className="rounded-xl border border-line p-3.5 text-sm"><p className="text-red-700 line-through decoration-red-300">{a}</p><p className="mt-1 font-semibold text-mint-dark">{b}</p><p className="mt-1.5 text-muted">{why}</p></li>))}</ul>
      : <p className="mt-2 text-sm text-muted">{empty}</p>}</section>
);
