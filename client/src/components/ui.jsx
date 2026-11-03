import { AlertTriangle, Loader2, RotateCw, SearchX } from 'lucide-react';
import { DIFFICULTY_STYLES } from '../utils/format';

export function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-sm text-zinc-500 ${className}`} role="status">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
      <AlertTriangle className="h-8 w-8 text-rose-500" />
      <div>
        <p className="font-semibold">{title}</p>
        {message && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}
      </div>
      {onRetry && (
        <button className="btn-outline" onClick={onRetry}>
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = SearchX, title, children }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-zinc-400" />
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-zinc-500 dark:text-zinc-400">{children}</div>}
    </div>
  );
}

export function DifficultyBadge({ value }) {
  if (!value) {
    return (
      <span className="inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700" title="The reference sheet gives no level for this problem">
        Unrated
      </span>
    );
  }
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${DIFFICULTY_STYLES[value]}`}>
      {value}
    </span>
  );
}

export function ProgressBar({ value, className = '', size = 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className={`w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${h} ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`${h} rounded-full bg-brand-600 transition-[width] duration-300 dark:bg-brand-500`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
