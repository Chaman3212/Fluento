import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Fluento home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">F</span>
      <span className="text-lg font-bold tracking-tight">FLUENTO</span>
    </Link>
  );
}

export const Field = forwardRef(function Field({ label, error, hint, id, className = '', ...props }, ref) {
  const fid = id || props.name;
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input id={fid} ref={ref} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : undefined} className={`input ${error ? 'border-red-500' : ''}`} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${fid}-err`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export function Spinner({ className = 'h-5 w-5' }) { return <Loader2 className={`animate-spin ${className}`} aria-hidden />; }
export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-xl bg-brand-soft ${className}`} aria-hidden />;

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-brand-dark"><Icon className="h-6 w-6" /></span>}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-8 text-center" role="alert">
      <p className="font-semibold">Couldn’t load this page</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function ScoreRing({ value, size = 80, stroke = 8, label = true }) {
  const v = value ?? 0; const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={value == null ? 'No score' : `Score ${v} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eaedff" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2563eb" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      {label && <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold leading-none">{value ?? '–'}</span></div>}
    </div>
  );
}
export function ScoreBar({ label, value, note }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-muted">{label}</span>
        <span className="font-mono font-bold">{value == null ? 'N/A' : `${value}%`}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-soft"><div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${value ?? 0}%` }} /></div>
      {note && <p className="mt-1 text-[11px] text-muted">{note}</p>}
    </div>
  );
}
export function StatusBadge({ status }) {
  const map = { COMPLETED: 'bg-mint text-mint-ink', FAILED: 'bg-red-100 text-red-800', UPLOADED: 'bg-brand-soft text-muted', QUEUED: 'bg-brand-soft text-muted', TRANSCRIBING: 'bg-brand-tint text-brand-dark', EVALUATING: 'bg-brand-tint text-brand-dark' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${map[status] || map.QUEUED}`}>{status}</span>;
}
