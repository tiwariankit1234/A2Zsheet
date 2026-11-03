import { Search, X } from 'lucide-react';

export const DEFAULT_FILTERS = { q: '', step: '', difficulty: '', platform: '', status: 'all', sort: 'order' };

function Select({ label, value, onChange, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
      <select className="select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}

export default function FilterBar({ filters, onChange, topics, resultCount, loading }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });
  const active = Object.keys(DEFAULT_FILTERS).some((k) => filters[k] !== DEFAULT_FILTERS[k]);

  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          className="input pl-9"
          placeholder="Search problems by name…"
          value={filters.q}
          maxLength={100}
          onChange={(e) => set('q')(e.target.value)}
          aria-label="Search problems by name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Select label="Topic" value={filters.step} onChange={set('step')}>
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.step} value={String(t.step)}>
              {t.step}. {t.name}
            </option>
          ))}
        </Select>
        <Select label="Level" value={filters.difficulty} onChange={set('difficulty')}>
          <option value="">All levels</option>
          <option value="Basic">Basic</option>
          <option value="Core">Core</option>
          <option value="Pro">Pro</option>
          <option value="Unrated">Unrated</option>
        </Select>
        <Select label="Status" value={filters.status} onChange={set('status')}>
          <option value="all">All</option>
          <option value="unsolved">Unsolved</option>
          <option value="solved">Solved</option>
          <option value="bookmarked">Bookmarked</option>
        </Select>
        <Select label="Platform" value={filters.platform} onChange={set('platform')}>
          <option value="">Any / none</option>
          <option value="leetcode">Has LeetCode</option>
          <option value="gfg">Has GFG</option>
          <option value="both">Has both</option>
          <option value="any">Has at least one</option>
          <option value="none">No external link</option>
        </Select>
        <Select label="Sort" value={filters.sort} onChange={set('sort')}>
          <option value="order">Sheet order</option>
          <option value="difficulty">Level (Basic → Pro)</option>
          <option value="title">Name (A → Z)</option>
        </Select>
      </div>
      {active && (
        <div className="flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span aria-live="polite">{loading ? 'Searching…' : `${resultCount} problem${resultCount === 1 ? '' : 's'} match`}</span>
          <button className="btn-ghost px-2 py-1" onClick={() => onChange(DEFAULT_FILTERS)}>
            <X className="h-4 w-4" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
