export const fmtDuration = (s = 0) => { const m = Math.floor(s / 60); const r = Math.round(s % 60); return `${m}:${String(r).padStart(2, '0')}`; };
export const fmtMinutes = (s = 0) => (s < 60 ? `${Math.round(s)}s` : `${Math.round(s / 60)} min`);
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtDateTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const TYPE_LABELS = { free: 'Free Speaking', daily: 'Daily Practice', interview: 'Interview', topic: 'Topic-Based', qa: 'Q&A' };
