import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { Field, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi, errorMessage } from '../api/client.js';

export const passwordRule = z.string().min(8, 'At least 8 characters').regex(/[a-z]/, 'Add a lowercase letter').regex(/[A-Z]/, 'Add an uppercase letter').regex(/\d/, 'Add a number');
export const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: passwordRule, confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

const Submit = ({ busy, children }) => <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}{children}</button>;
const FormError = ({ msg }) => msg ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p> : null;

export function LoginPage() {
  const { login } = useAuth(); const nav = useNavigate(); const loc = useLocation(); const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (d) => { setErr(''); try { await login(d); nav(loc.state?.from || '/dashboard', { replace: true }); } catch (e) { setErr(errorMessage(e)); } };
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue practicing." footer={<>New to Fluento? <Link to="/register" className="font-semibold text-brand-dark">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError msg={err} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand-dark">Forgot password?</Link></div>
        <Submit busy={isSubmitting}>Sign in</Submit>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register: signup } = useAuth(); const nav = useNavigate(); const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) });
  const onSubmit = async (d) => { setErr(''); try { await signup(d); nav('/dashboard', { replace: true }); } catch (e) { setErr(errorMessage(e)); } };
  return (
    <AuthLayout title="Create your account" subtitle="Start improving your spoken English today." footer={<>Already registered? <Link to="/login" className="font-semibold text-brand-dark">Sign in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError msg={err} />
        <Field label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" autoComplete="new-password" hint="8+ characters with upper, lower case and a number" error={errors.password?.message} {...register('password')} />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Submit busy={isSubmitting}>Create account</Submit>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false); const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(z.object({ email: z.string().trim().email('Enter a valid email') })) });
  const onSubmit = async (d) => { setErr(''); try { await authApi.forgot(d); setSent(true); } catch (e) { setErr(errorMessage(e)); } };
  return (
    <AuthLayout title="Reset your password" subtitle="We’ll email you a secure link, valid for 30 minutes." footer={<Link to="/login" className="font-semibold text-brand-dark">Back to sign in</Link>}>
      {sent ? <p role="status" className="rounded-xl bg-mint/40 p-4 text-sm text-mint-ink">If an account exists for that email, a reset link is on its way. Check your inbox.</p> : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormError msg={err} />
          <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Submit busy={isSubmitting}>Send reset link</Submit>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const token = params.get('token') || ''; const nav = useNavigate(); const toast = useToast(); const [err, setErr] = useState('');
  const schema = z.object({ password: passwordRule, confirmPassword: z.string() }).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async (d) => { setErr(''); try { await authApi.reset({ token, password: d.password }); toast.success('Password updated. Please sign in.'); nav('/login', { replace: true }); } catch (e) { setErr(errorMessage(e)); } };
  if (!/^[a-f0-9]{64}$/.test(token)) return <AuthLayout title="Invalid link" subtitle="This reset link is missing or malformed." footer={<Link to="/forgot-password" className="font-semibold text-brand-dark">Request a new link</Link>} />;
  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError msg={err} />
        <Field label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Submit busy={isSubmitting}>Update password</Submit>
      </form>
    </AuthLayout>
  );
}
