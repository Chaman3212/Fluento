import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react';
import { practiceApi, errorMessage } from '../api/client.js';
import { Skeleton, EmptyState, ErrorState, StatusBadge } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fmtDateTime, fmtDuration, TYPE_LABELS } from '../utils/format.js';

export default function HistoryPage() {
  const toast = useToast();
  const [f, setF] = useState({ page: 1, q: '', status: '', practiceType: '', sort: 'newest' });
  const [qInput, setQInput] = useState('');
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { const t = setTimeout(() => setF((x) => ({ ...x, q: qInput, page: 1 })), 350); return () => clearTimeout(t); }, [qInput]);
  const load = async (filters = f) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try { const params = Object.fromEntries(Object.entries({ ...filters, limit: 10 }).filter(([, v]) => v !== '')); setState({ loading: false, data: await practiceApi.list(params), error: null }); }
    catch (e) { setState({ loading: false, data: null, error: errorMessage(e) }); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(f); }, [f]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, page: 1 }));

  async function del(id) {
    try { await practiceApi.remove(id); toast.success('Session deleted'); setConfirm(null); load(); } catch (e) { toast.error(errorMessage(e)); }
  }
  const { loading, data, error } = state;
  const filtered = f.q || f.status || f.practiceType;
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Practice History</h1><p className="text-muted">Every session you’ve recorded.</p></div>
      <div className="card grid gap-3 p-4 md:grid-cols-[1fr_repeat(3,170px)]">
        <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search topics" aria-label="Search topics" value={qInput} onChange={(e) => setQInput(e.target.value)} /></div>
        <select className="input" aria-label="Filter by status" value={f.status} onChange={set('status')}><option value="">All statuses</option>{['COMPLETED', 'FAILED', 'QUEUED', 'TRANSCRIBING', 'EVALUATING'].map((s) => <option key={s}>{s}</option>)}</select>
        <select className="input" aria-label="Filter by type" value={f.practiceType} onChange={set('practiceType')}><option value="">All types</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="input" aria-label="Sort" value={f.sort} onChange={set('sort')}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="score_desc">Highest score</option><option value="score_asc">Lowest score</option></select>
      </div>

      {error ? <ErrorState message={error} onRetry={() => load()} /> : loading && !data ? <Skeleton className="h-64" /> : data.items.length === 0 ? (
        <EmptyState icon={HistoryIcon} title={filtered ? 'No sessions match your filters' : 'No sessions yet'} text={filtered ? 'Try clearing the search or filters.' : 'Record your first practice session to see it here.'}
          action={!filtered && <Link to="/studio" className="btn-primary">Open Studio</Link>} />
      ) : (
        <>
          <ul className={`card divide-y divide-line ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((s) => (
              <li key={s._id} className="flex items-center gap-3 p-4">
                <Link to={`/feedback/${s._id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.topic || TYPE_LABELS[s.practiceType]}</p>
                  <p className="font-mono text-[11px] text-muted">{fmtDateTime(s.createdAt)} · {TYPE_LABELS[s.practiceType]} · {fmtDuration(s.duration)}</p>
                </Link>
                <StatusBadge status={s.status} />
                <span className="w-10 text-right font-mono text-lg font-bold text-brand-dark">{s.evaluation?.overallScore ?? '–'}</span>
                <button onClick={() => setConfirm(s)} aria-label={`Delete session ${s.topic || ''}`} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </li>))}
          </ul>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{data.total} session{data.total === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <button className="btn-secondary h-9 px-3" disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <span className="font-mono text-xs">Page {data.page} / {data.pages}</span>
              <button className="btn-secondary h-9 px-3" disabled={f.page >= data.pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </>
      )}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="card w-full max-w-sm p-6"><h2 id="del-title" className="text-lg font-bold">Delete this session?</h2>
            <p className="mt-1 text-sm text-muted">The recording, transcript and feedback will be permanently removed.</p>
            <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn-danger" onClick={() => del(confirm._id)}>Delete</button></div></div>
        </div>)}
    </div>
  );
}
