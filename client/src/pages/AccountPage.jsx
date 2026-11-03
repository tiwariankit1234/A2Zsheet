import { useState } from 'react';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSheet } from '../context/SheetContext';
import { useToast } from '../context/ToastContext';

function AuthForm() {
  const { register, login } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') {
        await register(form);
        toast.success('Account created - your progress is saved to it.');
      } else {
        await login({ email: form.email, password: form.password });
        toast.success('Signed in. Progress from this browser was merged in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="card mx-auto max-w-md p-5">
      <div className="mb-4 grid grid-cols-2 rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
        {['register', 'login'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-md py-1.5 font-medium ${mode === m ? 'bg-white shadow-sm dark:bg-zinc-900' : 'text-zinc-500'}`}
          >
            {m === 'register' ? 'Create account' : 'Sign in'}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {mode === 'register'
          ? 'Your progress is already saved for this browser. Create an account to keep it and use it on other devices.'
          : 'Sign in to an existing account. Anything you ticked in this browser will be added to it.'}
      </p>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name (optional)</span>
            <input className="input" maxLength={60} autoComplete="name" {...field('name')} />
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input className="input" type="email" required autoComplete="email" {...field('email')} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            className="input"
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            maxLength={128}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            {...field('password')}
          />
          {mode === 'register' && <span className="mt-1 block text-xs text-zinc-500">At least 8 characters.</span>}
        </label>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { summary } = useSheet();
  const toast = useToast();

  if (!user || user.isGuest) {
    return (
      <div className="space-y-5">
        <div className="mx-auto max-w-md">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <UserRound className="h-6 w-6" /> Account
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">You are using a guest session ({summary.solved} solved so far).</p>
        </div>
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <ShieldCheck className="h-6 w-6 text-brand-600" /> Account
      </h1>
      <div className="card space-y-2 p-5 text-sm">
        {user.name && (
          <p>
            <span className="text-zinc-500">Name:</span> {user.name}
          </p>
        )}
        <p>
          <span className="text-zinc-500">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-zinc-500">Progress:</span> {summary.solved}/{summary.total} solved · {summary.bookmarked} bookmarked
        </p>
      </div>
      <button
        className="btn-outline"
        onClick={async () => {
          try {
            await logout();
            toast.info('Signed out. A fresh guest session has started.');
          } catch (e) {
            toast.error(e.message);
          }
        }}
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
