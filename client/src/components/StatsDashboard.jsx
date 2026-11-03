import { useSheet } from '../context/SheetContext';
import { ProgressBar } from './ui';
import { DIFFICULTY_STYLES } from '../utils/format';

function Stat({ label, value, sub }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
    </div>
  );
}

export default function StatsDashboard() {
  const { summary } = useSheet();
  const levels = ['Basic', 'Core', 'Pro'].filter((d) => summary.byDifficulty[d]);

  return (
    <section aria-label="Progress overview" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total problems" value={summary.total} />
        <Stat label="Solved" value={summary.solved} />
        <Stat label="Remaining" value={summary.remaining} />
        <Stat label="Completion" value={`${summary.percentage.toFixed(1)}%`} sub={`${summary.bookmarked} bookmarked`} />
      </div>
      <div className="card px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Overall progress</span>
          <span className="font-mono tabular-nums text-zinc-500">
            {summary.solved}/{summary.total}
          </span>
        </div>
        <ProgressBar value={summary.percentage} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {levels.map((d) => (
            <span key={d} className="flex items-center gap-1.5">
              <span className={`rounded px-1.5 py-0.5 font-medium ring-1 ring-inset ${DIFFICULTY_STYLES[d]}`}>{d}</span>
              <span className="font-mono tabular-nums">
                {summary.byDifficulty[d].solved}/{summary.byDifficulty[d].total}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
