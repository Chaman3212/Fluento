import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mic, Upload, FileText, Sparkles, TrendingUp, Briefcase, Wand2, Waves, Menu, X, ChevronDown, Check } from 'lucide-react';
import { Logo } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  { n: '01', t: 'RECORD', tag: 'MediaRecorder API', d: 'Speak 1–2 minutes naturally with in-browser mic capture.', icon: Mic },
  { n: '02', t: 'UPLOAD', tag: 'Secure upload', d: 'Audio is validated and stored privately, then queued for processing.', icon: Upload },
  { n: '03', t: 'TRANSCRIBE', tag: 'OpenAI speech-to-text', d: 'Accurate voice-to-text with word timestamps for pace and pauses.', icon: FileText },
  { n: '04', t: 'ANALYZE', tag: 'OpenAI evaluation', d: 'A structured audit of grammar, vocabulary, fluency and clarity.', icon: Sparkles },
  { n: '05', t: 'IMPROVE', tag: 'AI feedback', d: 'Mistake rewrites, vocabulary upgrades and a personal practice plan.', icon: Wand2 },
  { n: '06', t: 'TRACK', tag: 'Progress analytics', d: 'Scores, streaks and growth curves saved over time.', icon: TrendingUp },
];
const FEATURES = [
  { icon: Waves, title: 'Fluency & delivery insight', text: 'Words per minute, pauses and filler words measured from your real recording timestamps.', tags: ['Pace', 'Pauses', 'Fillers'] },
  { icon: Briefcase, title: 'Interview simulation mode', text: 'Practice behavioral and technical questions and get feedback on structure and relevance.', tags: ['STAR method', 'Q&A practice'] },
  { icon: Wand2, title: 'Sentence & vocabulary polisher', text: 'See your own sentences rewritten, with stronger word choices and clear explanations.', tags: ['Concise diction', 'Corrections'] },
];
const GOALS = [
  { who: 'Job seekers', text: 'Rehearse interview answers until they sound confident, structured and natural.' },
  { who: 'Students', text: 'Build speaking fluency for exams, presentations and academic life abroad.' },
  { who: 'Professionals', text: 'Sharpen meetings, pitches and client calls with precise, polished English.' },
];
const FAQ = [
  ['How are my scores calculated?', 'Your speech is transcribed, then an AI model scores grammar, vocabulary, fluency, clarity and relevance against a fixed rubric. Pace, pauses and fillers are measured from word timestamps. Scores are coaching estimates, not an official proficiency certification.'],
  ['Does Fluento score my pronunciation?', 'Not yet. Evaluation is based on the transcript and measured timing, which cannot reliably judge accent or phonetics, so Fluento shows pronunciation as not measured instead of inventing a number.'],
  ['Is my audio private?', 'Yes. Recordings are stored privately, are only accessible to your account, and are deleted when you delete a session or your account.'],
  ['What audio can I upload?', 'WebM, OGG, WAV, MP3 and M4A files. File contents are verified, not just the file extension.'],
  ['Is it free?', 'You can create an account and start practicing right away.'],
];
const NAVLINKS = [['How it works', '#how'], ['Features', '#features'], ['Analytics', '#analytics'], ['FAQ', '#faq']];

export default function LandingPage() {
  const { user } = useAuth(); const [open, setOpen] = useState(false);
  const cta = user ? '/dashboard' : '/register';
  return (
    <div className="bg-surface">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {NAVLINKS.map(([l, h]) => <a key={h} href={h} className="text-sm font-semibold text-muted hover:text-ink">{l}</a>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? <Link to="/dashboard" className="btn-primary h-10">Open dashboard</Link> : <>
              <Link to="/login" className="btn-ghost h-10">Sign in</Link><Link to="/register" className="btn-primary h-10">Get started</Link></>}
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-line bg-white px-5 py-3 md:hidden">
            {NAVLINKS.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-sm font-semibold">{l}</a>)}
            <div className="flex gap-2 pt-2">{user ? <Link to="/dashboard" className="btn-primary flex-1">Dashboard</Link> : <><Link to="/login" className="btn-secondary flex-1">Sign in</Link><Link to="/register" className="btn-primary flex-1">Get started</Link></>}</div>
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-2 lg:pt-24">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00174b]">
            <span className="h-2 w-2 rounded-full bg-brand-dark" /> AI-powered communication coach
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">From voice to measurable improvement.</h1>
          <p className="mt-4 max-w-lg text-lg font-medium text-muted">Practice deliberately. Improve measurably. Record yourself speaking English and get specific, actionable AI feedback in minutes.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={cta} className="btn-primary">Start Practicing <ArrowRight className="h-4 w-4" /></Link>
            <a href="#how" className="btn-secondary"><Sparkles className="h-4 w-4 text-brand" /> Explore Features</a>
          </div>
        </div>
        <div className="card animate-rise p-5 shadow-lift" style={{ animationDelay: '.15s' }} aria-label="Sample evaluation preview">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft"><Mic className="h-4 w-4 text-brand-dark" /></span>
              <div><p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Sample evaluation</p><p className="text-xs font-semibold">Executive Pitch Session</p></div></div>
            <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 font-mono text-[11px] font-semibold text-mint-ink"><span className="h-1.5 w-1.5 rounded-full bg-mint-dark" />Analyzed</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-brand-wash p-4">
            <div><p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Overall speaking score</p>
              <p className="flex items-baseline gap-1"><span className="font-mono text-3xl font-bold text-brand-dark">88</span><span className="font-mono text-xs text-muted">/ 100</span></p></div>
            <div className="flex h-10 items-center gap-[3px]" aria-hidden>{[16, 28, 40, 20, 32, 24, 36].map((h, i) => <span key={i} style={{ height: h }} className={`w-1.5 rounded-full ${i === 3 ? 'bg-[#b4c5ff]' : 'bg-brand'}`} />)}</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[['Fluency', '92%', 'Optimal pace'], ['Grammar', '85%', 'Minor tenses'], ['Vocabulary', '89%', 'Varied range']].map(([k, v, n]) => (
              <div key={k} className="rounded-xl bg-brand-soft p-2.5"><p className="font-mono text-[11px] font-semibold text-muted">{k}</p><p className="text-xl font-bold">{v}</p><p className="font-mono text-[11px] font-medium text-mint-dark">{n}</p></div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">Illustrative example. Your results come from your own recordings.</p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <p className="eyebrow">End-to-end pipeline</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-2 max-w-xl text-muted">Six steps from your voice to a personalized improvement plan.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(({ n, t, tag, d, icon: Icon }) => (
            <div key={n} className="card flex gap-3 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2e7ff] font-mono text-xs font-bold text-brand-dark">{n}</span>
              <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4 text-brand" />{t}</h3><span className="rounded bg-brand-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">{tag}</span></div>
                <p className="mt-1 text-[13px] leading-5 text-muted">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <p className="eyebrow">Built for high stakes</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Core capabilities</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, tags }, i) => (
            <div key={title} className="card p-5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${['bg-brand-tint', 'bg-[#d8e2ff]', 'bg-mint'][i]}`}><Icon className="h-5 w-5 text-brand-dark" /></span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-1 text-[13px] leading-5 text-muted">{text}</p>
              <div className="mt-3 flex flex-wrap gap-2">{tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="analytics" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Evaluation you can trust</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Honest AI feedback, with real analytics</h2>
            <p className="mt-3 text-muted">Fluento separates what it measures from what it estimates. Pace, pauses and filler words come from your audio timestamps. Grammar, vocabulary and clarity are AI estimates from your transcript, scored against a clear rubric.</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {['Grammar, vocabulary, fluency, clarity and relevance scores', 'Corrected sentences with plain-English explanations', 'Weekly trends, streaks and weakest-skill tracking', 'A personalized weekly plan built from your own results'].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-dark" />{x}</li>))}
            </ul>
          </div>
          <div className="card p-5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Weekly progress (illustrative)</p>
            <div className="mt-4 flex h-40 items-end gap-3" aria-hidden>
              {[62, 68, 66, 74, 79, 77, 85].map((h, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t-md bg-brand" style={{ height: `${h}%`, opacity: 0.45 + i * 0.09 }} /><span className="font-mono text-[10px] text-muted">{'MTWTFSS'[i]}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Who it’s for</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Speak with confidence where it counts</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {GOALS.map((g) => <figure key={g.who} className="card p-5"><figcaption className="font-mono text-xs font-bold uppercase tracking-wider text-brand-dark">{g.who}</figcaption><p className="mt-2 text-[15px] leading-6">{g.text}</p></figure>)}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Common questions</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary>
              <p className="mt-2 text-sm leading-6 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl bg-brand p-8 text-center text-white shadow-lift sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight">Ready to master spoken clarity?</h2>
          <p className="mx-auto mt-3 max-w-md text-[#eeefff]">Record your first answer today and see exactly what to improve.</p>
          <Link to={cta} className="btn mt-6 bg-white text-brand-dark hover:bg-brand-wash">Get Started for Free <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-5 text-sm text-muted" aria-label="Footer">
            {NAVLINKS.map(([l, h]) => <a key={h} href={h} className="hover:text-ink">{l}</a>)}
            <Link to="/login" className="hover:text-ink">Sign in</Link>
          </nav>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Fluento</p>
        </div>
      </footer>
    </div>
  );
}
