import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useSheet } from '../context/SheetContext';
import useDebounce from '../hooks/useDebounce';
import useProblemQuery from '../hooks/useProblemQuery';
import StatsDashboard from '../components/StatsDashboard';
import FilterBar, { DEFAULT_FILTERS } from '../components/FilterBar';
import TopicAccordion from '../components/TopicAccordion';
import ProblemList, { ListHeader } from '../components/ProblemList';
import NotesDialog from '../components/NotesDialog';
import { EmptyState, ErrorState, Spinner } from '../components/ui';

const OPEN_KEY = 'a2z_open_sections';

function loadOpen() {
  try {
    const raw = JSON.parse(localStorage.getItem(OPEN_KEY) || '{}');
    return { steps: new Set(raw.steps || [1]), subs: new Set(raw.subs || []) };
  } catch {
    return { steps: new Set([1]), subs: new Set() };
  }
}

function filtersFromParams(sp) {
  const f = { ...DEFAULT_FILTERS };
  for (const k of Object.keys(DEFAULT_FILTERS)) if (sp.get(k)) f[k] = sp.get(k);
  return f;
}

export default function SheetPage() {
  const { topics, problems, status, error, reload, progressVersion } = useSheet();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [open, setOpen] = useState(loadOpen);
  const [notesFor, setNotesFor] = useState(null);

  const q = useDebounce(filters.q.trim(), 300);
  const query = useMemo(() => {
    const p = { q, sort: filters.sort };
    if (filters.step) p.step = filters.step;
    if (filters.difficulty) p.difficulty = filters.difficulty;
    if (filters.platform) p.platform = filters.platform;
    if (filters.status !== 'all') p.status = filters.status;
    return p;
  }, [q, filters.step, filters.difficulty, filters.platform, filters.status, filters.sort]);

  const active = Object.keys(query).some((k) => (k === 'sort' ? query.sort !== 'order' : Boolean(query[k])));
  const result = useProblemQuery(query, active, filters.status !== 'all' ? progressVersion : 0);

  // Keep filters in the URL so a filtered view survives refresh and can be shared.
  useEffect(() => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && v !== DEFAULT_FILTERS[k]) next.set(k, v);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify({ steps: [...open.steps], subs: [...open.subs] }));
    } catch {
      /* ignore */
    }
  }, [open]);

  const toggle = (kind, key) =>
    setOpen((o) => {
      const s = new Set(o[kind]);
      s.has(key) ? s.delete(key) : s.add(key);
      return { ...o, [kind]: s };
    });
  const expandAll = () =>
    setOpen({
      steps: new Set(topics.map((t) => t.step)),
      subs: new Set(problems.map((p) => `${p.step}|${p.subtopic}`)),
    });
  const collapseAll = () => setOpen({ steps: new Set(), subs: new Set() });
  const closeNotes = useCallback(() => setNotesFor(null), []);

  const visible = active ? result.items : problems;
  const byStep = useMemo(() => {
    const m = new Map();
    for (const p of visible || []) {
      if (!m.has(p.step)) m.set(p.step, []);
      m.get(p.step).push(p);
    }
    return m;
  }, [visible]);

  let body;
  if (status === 'loading') body = <Spinner label="Loading the sheet…" />;
  else if (status === 'error') body = <ErrorState title="Could not load the sheet" message={error} onRetry={reload} />;
  else if (active && result.error) body = <ErrorState title="Search failed" message={result.error} />;
  else if (active && result.loading && !result.items) body = <Spinner label="Searching…" />;
  else if (visible && visible.length === 0)
    body = (
      <EmptyState title="No problems match these filters">
        Try a different name or{' '}
        <button className="font-medium text-brand-700 underline dark:text-brand-500" onClick={() => setFilters(DEFAULT_FILTERS)}>
          clear all filters
        </button>
        .
      </EmptyState>
    );
  else if (active && filters.sort !== 'order')
    body = (
      <div className={`card overflow-hidden ${result.loading ? 'opacity-60' : ''}`}>
        <ListHeader />
        <ProblemList problems={visible} onOpenNotes={setNotesFor} showTopic />
      </div>
    );
  else
    body = (
      <div className={`space-y-3 ${result.loading ? 'opacity-60' : ''}`}>
        {topics
          .filter((t) => byStep.has(t.step))
          .map((t) => (
            <TopicAccordion
              key={t.step}
              topic={t}
              problems={byStep.get(t.step)}
              open={active || open.steps.has(t.step)}
              onToggle={() => toggle('steps', t.step)}
              openSubs={open.subs}
              onToggleSub={(k) => toggle('subs', k)}
              onOpenNotes={setNotesFor}
              filtered={active}
            />
          ))}
      </div>
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">A2Z DSA Sheet</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {problems.length || 'All'} problems in {topics.length || 'step-by-step'} steps, in the reference sheet&apos;s order. Tick a box when you solve one.
        </p>
      </div>

      {status === 'ready' && <StatsDashboard />}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        topics={topics}
        resultCount={result.total}
        loading={result.loading || filters.q.trim() !== q || (active && !result.items && !result.error)}
      />

      {status === 'ready' && !active && (
        <div className="flex justify-end gap-2">
          <button className="btn-ghost px-2 py-1" onClick={expandAll}>
            <ChevronsUpDown className="h-4 w-4" /> Expand all
          </button>
          <button className="btn-ghost px-2 py-1" onClick={collapseAll}>
            <ChevronsDownUp className="h-4 w-4" /> Collapse all
          </button>
        </div>
      )}

      {body}
      <NotesDialog problem={notesFor} onClose={closeNotes} />
    </div>
  );
}
