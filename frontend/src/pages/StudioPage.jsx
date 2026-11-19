import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Mic, FileAudio, X, Info } from 'lucide-react';
import Recorder from '../components/Recorder.jsx';
import { Spinner } from '../components/ui.jsx';
import { practiceApi, errorMessage } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDuration } from '../utils/format.js';

export const MODES = [
  { id: 'free', label: 'Free Speaking', hint: 'Speak about anything you like.', prompts: ['Tell me about your day', 'Describe something you learned recently', 'Talk about your goals for this year'] },
  { id: 'daily', label: 'Daily Practice', hint: 'Everyday conversation topics.', prompts: ['Describe your morning routine', 'What did you eat today and why?', 'Plan a weekend with friends'] },
  { id: 'interview', label: 'Interview', hint: 'Answer like you’re in a job interview.', prompts: ['Tell me about yourself', 'Describe a challenge you overcame', 'Why should we hire you?', 'Where do you see yourself in five years?'] },
  { id: 'topic', label: 'Topic-Based', hint: 'Give a short talk on a topic.', prompts: ['Is remote work better than office work?', 'How is technology changing education?', 'Describe a person who inspires you'] },
  { id: 'qa', label: 'Q & A', hint: 'Answer a specific question clearly.', prompts: ['What is your biggest strength?', 'Describe a time you led a team', 'How do you handle stress?'] },
];
const MAX_MB = 25; const ACCEPT = '.webm,.ogg,.wav,.mp3,.m4a,.mp4,audio/*';

export default function StudioPage() {
  const nav = useNavigate(); const toast = useToast(); const { user } = useAuth(); const [params] = useSearchParams();
  const [mode, setMode] = useState('free');
  const [topic, setTopic] = useState(params.get('topic') || '');
  const [difficulty, setDifficulty] = useState(user.preferences?.defaultDifficulty || 'intermediate');
  const [input, setInput] = useState('record');
  const [take, setTake] = useState(null); // { blob, duration, name, source }
  const [progress, setProgress] = useState(null); const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const current = useMemo(() => MODES.find((m) => m.id === mode), [mode]);

  function onFile(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`File is too large (max ${MAX_MB} MB).`);
    if (!/^(audio|video)\//.test(f.type) && !/\.(webm|ogg|wav|mp3|m4a|mp4)$/i.test(f.name)) return toast.error('Please choose an audio file (WebM, OGG, WAV, MP3 or M4A).');
    const url = URL.createObjectURL(f); const a = new Audio(url);
    a.onloadedmetadata = () => { setTake({ blob: f, duration: Math.round(a.duration || 0), name: f.name, source: 'upload' }); URL.revokeObjectURL(url); };
    a.onerror = () => { URL.revokeObjectURL(url); setTake({ blob: f, duration: 0, name: f.name, source: 'upload' }); };
  }

  async function submit() {
    if (!take) return;
    setBusy(true); setProgress(0);
    const fd = new FormData();
    fd.append('practiceType', mode); fd.append('topic', topic); fd.append('difficulty', difficulty);
    fd.append('duration', String(take.duration || 0)); fd.append('source', take.source);
    const ext = (take.blob.type.split('/')[1] || 'webm').split(';')[0];
    fd.append('audio', take.blob, take.name || `recording.${ext}`);
    try {
      const { id } = await practiceApi.create(fd, (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)));
      toast.success('Uploaded. Analyzing your speech…');
      nav(`/feedback/${id}`);
    } catch (e) { toast.error(errorMessage(e)); setBusy(false); setProgress(null); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Speaking Studio</h1><p className="text-muted">Choose a mode, record your answer, and get AI feedback.</p></div>

      <section className="card p-5" aria-label="Practice setup">
        <div role="radiogroup" aria-label="Practice mode" className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button key={m.id} role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)} disabled={busy}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${mode === m.id ? 'bg-brand text-white' : 'bg-brand-soft text-muted hover:bg-brand-tint'}`}>{m.label}</button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{current.hint}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
          <div><label htmlFor="topic" className="mb-1.5 block text-sm font-semibold">Topic or question <span className="font-normal text-muted">(optional)</span></label>
            <input id="topic" className="input" value={topic} maxLength={300} disabled={busy} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Tell me about yourself" /></div>
          <div><label htmlFor="diff" className="mb-1.5 block text-sm font-semibold">Difficulty</label>
            <select id="diff" className="input" value={difficulty} disabled={busy} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {current.prompts.map((p) => <button key={p} onClick={() => setTopic(p)} disabled={busy} className="chip hover:bg-brand-tint">{p}</button>)}
        </div>
      </section>

      <section className="card p-5" aria-label="Record or upload">
        <div className="mb-3 flex gap-2 border-b border-line pb-3">
          {[['record', 'Record', Mic], ['upload', 'Upload file', Upload]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => { setInput(id); setTake(null); }} disabled={busy}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${input === id ? 'bg-brand-tint text-brand-dark' : 'text-muted hover:bg-brand-soft'}`}><Icon className="h-4 w-4" />{label}</button>
          ))}
        </div>
        {input === 'record' ? (
          <Recorder disabled={busy} onComplete={({ blob, duration }) => setTake({ blob, duration, source: 'recording' })} onReset={() => setTake(null)} />
        ) : (
          <div className="py-4 text-center">
            <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" onChange={onFile} aria-label="Choose audio file" />
            {take ? (
              <div className="mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-brand-wash p-3 text-left">
                <FileAudio className="h-8 w-8 shrink-0 text-brand" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{take.name}</p><p className="font-mono text-xs text-muted">{fmtDuration(take.duration)} · {(take.blob.size / 1048576).toFixed(1)} MB</p></div>
                <button onClick={() => setTake(null)} disabled={busy} aria-label="Remove file"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line px-6 py-8 text-muted hover:border-brand hover:bg-brand-wash">
                <Upload className="h-7 w-7" /><span className="text-sm font-semibold text-ink">Choose an audio file</span><span className="text-xs">WebM, OGG, WAV, MP3, M4A · up to {MAX_MB} MB</span></button>
            )}
          </div>
        )}
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-brand-wash p-3 text-xs text-muted"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />Speak for 30 seconds to 2 minutes in a quiet place. Recordings are private to your account.</div>

        {busy && progress !== null && (
          <div className="mt-4" role="status"><div className="mb-1 flex justify-between text-xs font-semibold"><span>{progress < 100 ? 'Uploading…' : 'Starting analysis…'}</span><span>{progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-soft"><div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div></div>
        )}
        <button className="btn-primary mt-5 w-full" disabled={!take || busy} onClick={submit}>{busy ? <><Spinner className="h-4 w-4" />Submitting…</> : 'Analyze my speaking'}</button>
      </section>
    </div>
  );
}
