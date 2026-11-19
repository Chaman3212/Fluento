import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import Recorder from '../components/Recorder.jsx';
import { registerSchema, loginSchema } from '../pages/AuthPages.jsx';
import { errorMessage } from '../api/client.js';

vi.mock('../api/client.js', async (orig) => {
  const mod = await orig();
  return { ...mod, dashApi: { overview: vi.fn(() => new Promise(() => {})), analytics: vi.fn() }, authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), forgot: vi.fn(), reset: vi.fn() } };
});
import { authApi } from '../api/client.js';

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>,
);

describe('routing & auth guards', () => {
  beforeEach(() => { vi.clearAllMocks(); authApi.me.mockRejectedValue(new Error('401')); });

  it('renders the landing page with working CTAs', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: /from voice to measurable improvement/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /get started/i })[0]).toHaveAttribute('href', '/register');
  });
  it('redirects unauthenticated users from protected routes to login', async () => {
    renderAt('/dashboard');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
  it('shows 404 for unknown routes', async () => {
    renderAt('/nope');
    expect(await screen.findByText(/this page doesn’t exist/i)).toBeInTheDocument();
  });
  it('reset page rejects a malformed token', async () => {
    renderAt('/reset-password?token=abc');
    expect(await screen.findByText(/invalid link/i)).toBeInTheDocument();
  });
  it('logs in and reaches the dashboard shell', async () => {
    authApi.login.mockResolvedValue({ _id: '1', name: 'Aryan Dixit', email: 'a@b.com', preferences: {} });
    renderAt('/login');
    await userEvent.type(await screen.findByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rdX');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(authApi.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'Passw0rdX' }));
  });
  it('shows inline validation errors on the login form', async () => {
    renderAt('/login');
    await userEvent.click(await screen.findByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });
});

describe('form schemas', () => {
  const ok = { name: 'Aryan Dixit', email: 'a@b.com', password: 'Passw0rdX', confirmPassword: 'Passw0rdX' };
  it('accepts valid registration', () => expect(registerSchema.safeParse(ok).success).toBe(true));
  it('rejects weak / mismatched passwords', () => {
    expect(registerSchema.safeParse({ ...ok, password: 'weak', confirmPassword: 'weak' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, confirmPassword: 'Other1234' }).success).toBe(false);
  });
  it('login requires email', () => expect(loginSchema.safeParse({ email: 'x', password: 'y' }).success).toBe(false));
});

describe('Recorder', () => {
  it('shows a clear fallback when MediaRecorder is unavailable', async () => {
    render(<Recorder />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/isn’t available|upload an audio file/i);
  });
  it('offers a start button when recording is supported', async () => {
    const Original = globalThis.MediaRecorder;
    globalThis.MediaRecorder = class { static isTypeSupported() { return true; } };
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: vi.fn() }, configurable: true });
    render(<Recorder />);
    expect(await screen.findByRole('button', { name: /start recording/i })).toBeEnabled();
    globalThis.MediaRecorder = Original;
  });
});

describe('errorMessage', () => {
  it('prefers server validation detail, then message, then fallback', () => {
    expect(errorMessage({ response: { data: { error: { message: 'Bad', details: { email: ['Invalid email'] } } } } })).toBe('Invalid email');
    expect(errorMessage({ response: { data: { error: { message: 'Nope' } } } })).toBe('Nope');
    expect(errorMessage({ code: 'ERR_NETWORK' })).toMatch(/cannot reach/i);
    expect(errorMessage({})).toMatch(/something went wrong/i);
  });
});
