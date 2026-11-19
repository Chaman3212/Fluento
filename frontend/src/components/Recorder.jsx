import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Pause, Play, Square, RotateCcw, AlertTriangle } from 'lucide-react';
import { fmtDuration } from '../utils/format.js';

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const pickMime = () => (typeof MediaRecorder === 'undefined' ? '' : MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || '');

// Controlled recording UI. Calls onComplete({ blob, duration }) when a take is ready, onReset when cleared.
export default function Recorder({ onComplete, onReset, disabled, maxSeconds = 600 }) {
  const [state, setState] = useState('idle'); // idle | requesting | recording | paused | recorded | denied | unsupported
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState(null);
  const rec = useRef(null); const chunks = useRef([]); const stream = useRef(null); const timer = useRef(null); const secs = useRef(0);

  const stopTimer = () => { clearInterval(timer.current); timer.current = null; };
  const startTimer = useCallback(() => {
    stopTimer();
    timer.current = setInterval(() => { secs.current += 1; setSeconds(secs.current); }, 1000);
  }, []);
  const cleanupStream = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };

  useEffect(() => () => { stopTimer(); cleanupStream(); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') setState('unsupported'); }, []);

  const stop = useCallback(() => { if (rec.current && rec.current.state !== 'inactive') rec.current.stop(); stopTimer(); }, []);
  useEffect(() => { if (state === 'recording' && seconds >= maxSeconds) stop(); }, [seconds, maxSeconds, state, stop]);

  async function start() {
    setState('requesting');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) { setState(e?.name === 'NotFoundError' ? 'unsupported' : 'denied'); return; }
    const mimeType = pickMime();
    rec.current = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    chunks.current = []; secs.current = 0; setSeconds(0);
    rec.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.current.mimeType || mimeType || 'audio/webm' });
      cleanupStream();
      setUrl(URL.createObjectURL(blob)); setState('recorded');
      onComplete?.({ blob, duration: secs.current });
    };
    rec.current.start(1000); setState('recording'); startTimer();
  }
  const pause = () => { rec.current?.pause(); stopTimer(); setState('paused'); };
  const resume = () => { rec.current?.resume(); startTimer(); setState('recording'); };
  const reset = () => { setUrl(null); setSeconds(0); secs.current = 0; setState('idle'); onReset?.(); };

  if (state === 'unsupported') return (
    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> Recording isn’t available in this browser or no microphone was found. You can upload an audio file instead.
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {state === 'denied' && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> Microphone access was blocked. Allow it in your browser’s site settings, then try again.
        </div>
      )}
      <div className="font-mono text-4xl font-bold tabular-nums" aria-live="off">{fmtDuration(seconds)}</div>
      {(state === 'recording' || state === 'paused') && (
        <p className="text-xs font-semibold text-muted">{state === 'recording' ? 'Recording…' : 'Paused'} · max {fmtDuration(maxSeconds)}</p>
      )}
      {state === 'recorded' && url && <audio controls src={url} className="w-full max-w-md" aria-label="Playback of your recording" />}
      <div className="flex items-center gap-3">
        {(state === 'idle' || state === 'denied' || state === 'requesting') && (
          <button onClick={start} disabled={disabled || state === 'requesting'} aria-label="Start recording"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-lift transition hover:bg-brand-dark disabled:opacity-60">
            <Mic className="h-8 w-8" />
          </button>
        )}
        {state === 'recording' && (
          <>
            <button onClick={pause} aria-label="Pause" className="btn-secondary h-12 w-12 rounded-full p-0"><Pause className="h-5 w-5" /></button>
            <button onClick={stop} aria-label="Stop recording" className="flex h-20 w-20 animate-pulseRing items-center justify-center rounded-full bg-red-600 text-white"><Square className="h-7 w-7 fill-current" /></button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button onClick={resume} aria-label="Resume" className="btn-primary h-12 w-12 rounded-full p-0"><Play className="h-5 w-5" /></button>
            <button onClick={stop} aria-label="Stop recording" className="btn-secondary h-12 w-12 rounded-full p-0"><Square className="h-5 w-5" /></button>
          </>
        )}
        {state === 'recorded' && <button onClick={reset} disabled={disabled} className="btn-secondary"><RotateCcw className="h-4 w-4" /> Re-record</button>}
      </div>
    </div>
  );
}
