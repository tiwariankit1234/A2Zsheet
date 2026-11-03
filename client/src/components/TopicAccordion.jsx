import { ChevronRight } from 'lucide-react';
import { useSheet } from '../context/SheetContext';
import { groupBySubtopic, pct } from '../utils/format';
import { ProgressBar } from './ui';
import ProblemList, { ListHeader } from './ProblemList';

function Chevron({ open }) {
  return <ChevronRight className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`} />;
}

export default function TopicAccordion({ topic, problems, open, onToggle, openSubs, onToggleSub, onOpenNotes, filtered }) {
  const { summary } = useSheet();
  const solved = summary.solvedInStep(topic.step);
  const groups = groupBySubtopic(problems);
  const panelId = `step-${topic.step}`;

  return (
    <section className="card overflow-hidden">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <Chevron open={open} />
          <span className="w-14 shrink-0 font-mono text-xs text-zinc-500">Step {topic.step}</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{topic.name}</span>
          {filtered && (
            <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
              {problems.length} match{problems.length === 1 ? '' : 'es'}
            </span>
          )}
          <span className="hidden w-32 sm:block">
            <ProgressBar value={pct(solved, topic.problemCount)} size="sm" />
          </span>
          <span className="w-16 text-right font-mono text-xs tabular-nums text-zinc-500">
            {solved}/{topic.problemCount}
          </span>
        </button>
      </h2>

      {open && (
        <div id={panelId} className="border-t border-zinc-200 dark:border-zinc-800">
          {groups.map((g) => {
            const subOpen = filtered || openSubs.has(`${topic.step}|${g.name}`);
            const subSolved = summary.solvedInSubtopic(topic.step, g.name);
            return (
              <div key={g.name} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => onToggleSub(`${topic.step}|${g.name}`)}
                  aria-expanded={subOpen}
                  className="flex w-full items-center gap-3 bg-zinc-50/70 px-4 py-2.5 text-left text-sm hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/60"
                >
                  <Chevron open={subOpen} />
                  <span className="flex-1 font-medium text-zinc-700 dark:text-zinc-200">{g.name}</span>
                  <span className="font-mono text-xs tabular-nums text-zinc-500">
                    {filtered ? `${g.items.length} shown` : `${subSolved}/${g.items.length}`}
                  </span>
                </button>
                {subOpen && (
                  <div className="bg-white dark:bg-zinc-900">
                    <ListHeader />
                    <ProblemList problems={g.items} onOpenNotes={onOpenNotes} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
