import { useSheet } from '../context/SheetContext';
import ProblemRow from './ProblemRow';

export function ListHeader() {
  return (
    <div className="hidden grid-cols-[2.5rem_auto_1fr_7.5rem_7.5rem_auto] gap-x-3 border-b border-zinc-200 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:grid dark:border-zinc-800 dark:text-zinc-400">
      <span>#</span>
      <span className="w-5" />
      <span>Problem</span>
      <span>LeetCode</span>
      <span>GFG</span>
      <span className="w-16 text-right">Actions</span>
    </div>
  );
}

export default function ProblemList({ problems, onOpenNotes, showTopic }) {
  const { getState, toggleSolved, toggleBookmark } = useSheet();
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
      {problems.map((p) => (
        <ProblemRow
          key={p.id}
          problem={p}
          state={getState(p.id)}
          onToggleSolved={toggleSolved}
          onToggleBookmark={toggleBookmark}
          onOpenNotes={onOpenNotes}
          showTopic={showTopic}
        />
      ))}
    </ul>
  );
}
