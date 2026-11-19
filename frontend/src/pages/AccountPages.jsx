import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { profileApi, errorMessage } from '../api/client.js';
import { Field, Spinner } from '../components/ui.jsx';
import { passwordRule } from './AuthPages.jsx';
import { fmtDate } from '../utils/format.js';

const Section = ({ title, desc, children }) => (<section className="card p-5 sm:p-6"><h2 className="text-lg font-semibold">{title}</h2>{desc && <p className="text-sm text-muted">{desc}</p>}<div className="mt-4">{children}</div></section>);
const Toggle = ({ label, desc, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-2"><span><span className="block text-sm font-semibold">{label}</span><span className="text-xs text-muted">{desc}</span></span>
    <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-9 cursor-pointer accent-[#2563eb]" /></label>
);

export function ProfilePage() {
  const { user, setUser } = useAuth(); const toast = useToast();
  const nameForm = useForm({ resolver: zodResolver(z.object({ name: z.string().trim().min(2, 'Enter your name').max(80), goal: z.string(), nativeLanguage: z.string().max(60) })),
    defaultValues: { name: user.name, goal: user.profile?.goal || '', nativeLanguage: user.profile?.nativeLanguage || '' } });
  const pwSchema = z.object({ currentPassword: z.string().min(1, 'Required'), newPassword: passwordRule, confirm: z.string() }).refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });
  const pwForm = useForm({ resolver: zodResolver(pwSchema) });

  const saveProfile = async (d) => { try { setUser(await profileApi.update({ name: d.name, profile: { goal: d.goal, nativeLanguage: d.nativeLanguage } })); toast.success('Profile updated'); } catch (e) { toast.error(errorMessage(e)); } };
  const savePw = async (d) => { try { await profileApi.password({ currentPassword: d.currentPassword, newPassword: d.newPassword }); toast.success('Password changed'); pwForm.reset(); } catch (e) { toast.error(errorMessage(e)); } };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
      <Section title="Personal details" desc={`Member since ${fmtDate(user.createdAt)}`}>
        <form onSubmit={nameForm.handleSubmit(saveProfile)} className="space-y-4" noValidate>
          <Field label="Full name" error={nameForm.formState.errors.name?.message} {...nameForm.register('name')} />
          <Field label="Email" value={user.email} readOnly disabled hint="Email can’t be changed." onChange={() => {}} />
          <div><label htmlFor="goal" className="mb-1.5 block text-sm font-semibold">Main goal</label>
            <select id="goal" className="input" {...nameForm.register('goal')}><option value="">Not set</option><option value="interview">Job interviews</option><option value="work">Work communication</option><option value="academic">Academic</option><option value="daily">Daily conversation</option></select></div>
          <Field label="Native language" {...nameForm.register('nativeLanguage')} />
          <button className="btn-primary" disabled={nameForm.formState.isSubmitting}>{nameForm.formState.isSubmitting && <Spinner className="h-4 w-4" />}Save changes</button>
        </form>
      </Section>
      <Section title="Change password">
        <form onSubmit={pwForm.handleSubmit(savePw)} className="space-y-4" noValidate>
          <Field label="Current password" type="password" autoComplete="current-password" error={pwForm.formState.errors.currentPassword?.message} {...pwForm.register('currentPassword')} />
          <Field label="New password" type="password" autoComplete="new-password" error={pwForm.formState.errors.newPassword?.message} {...pwForm.register('newPassword')} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" error={pwForm.formState.errors.confirm?.message} {...pwForm.register('confirm')} />
          <button className="btn-primary" disabled={pwForm.formState.isSubmitting}>Update password</button>
        </form>
      </Section>
    </div>
  );
}

export function SettingsPage() {
  const { user, setUser, logout } = useAuth(); const toast = useToast(); const nav = useNavigate();
  const p = user.preferences || {}; const [confirming, setConfirming] = useState(false); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const save = async (patch) => { try { setUser(await profileApi.update({ preferences: patch })); toast.success('Preferences saved'); } catch (e) { toast.error(errorMessage(e)); } };
  async function remove() {
    setBusy(true);
    try { await profileApi.remove({ password: pw }); setUser(null); toast.success('Your account was deleted'); nav('/', { replace: true }); }
    catch (e) { toast.error(errorMessage(e)); setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
      <Section title="Practice preferences">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="dg" className="mb-1.5 block text-sm font-semibold">Daily goal (minutes)</label>
            <input id="dg" type="number" min={1} max={240} className="input" defaultValue={p.dailyGoalMinutes ?? 10} onBlur={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 240 && v !== p.dailyGoalMinutes) save({ dailyGoalMinutes: v }); }} /></div>
          <div><label htmlFor="dd" className="mb-1.5 block text-sm font-semibold">Default difficulty</label>
            <select id="dd" className="input" value={p.defaultDifficulty || 'intermediate'} onChange={(e) => save({ defaultDifficulty: e.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
        </div>
      </Section>
      <Section title="Notifications">
        <Toggle label="Practice reminders" desc="Email reminders to practice." checked={!!p.emailReminders} onChange={(v) => save({ emailReminders: v })} />
        <Toggle label="Weekly summary" desc="A weekly email with your progress." checked={p.weeklySummary !== false} onChange={(v) => save({ weeklySummary: v })} />
      </Section>
      <Section title="Session"><button className="btn-secondary" onClick={async () => { await logout(); nav('/'); }}>Log out</button></Section>
      <section className="card border border-red-200 p-5 sm:p-6"><h2 className="text-lg font-semibold text-red-700">Delete account</h2>
        <p className="mt-1 text-sm text-muted">Permanently deletes your account, recordings, transcripts and progress. This can’t be undone.</p>
        {confirming ? (
          <div className="mt-4 space-y-3"><Field label="Confirm with your password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="flex gap-2"><button className="btn-secondary" onClick={() => { setConfirming(false); setPw(''); }}>Cancel</button><button className="btn-danger" disabled={!pw || busy} onClick={remove}>{busy && <Spinner className="h-4 w-4" />}Delete my account</button></div></div>
        ) : <button className="btn-danger mt-4" onClick={() => setConfirming(true)}>Delete account…</button>}
      </section>
    </div>
  );
}
