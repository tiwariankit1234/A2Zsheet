import { memo } from 'react';
import { Check, ExternalLink, Lock, NotebookPen, Star } from 'lucide-react';
import { DifficultyBadge } from './ui';
import { LC_DIFFICULTY_STYLES } from '../utils/format';

function PlatformLink({ href, label, title, children, compact = false }) {
  if (!href) {
    return (
      <span className="text-xs text-zinc-400 dark:text-zinc-500" title={`No verified ${label} problem`}>
        {compact ? `${label}: Not available` : 'Not available'}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      {children}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

function ProblemRow({ problem: p, state, onToggleSolved, onToggleBookmark, onOpenNotes, showTopic = false }) {
  const solved = state.solved;
  const lc = p.leetcode;
  const gfg = p.gfg;

  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[2.5rem_auto_1fr_7.5rem_7.5rem_auto] sm:px-4 ${
        solved ? 'bg-brand-50/60 dark:bg-brand-900/15' : ''
      }`}
    >
      <span className="hidden font-mono text-xs tabular-nums text-zinc-400 sm:block">{p.order}</span>

      <button
        type="button"
        role="checkbox"
        aria-checked={solved}
        aria-label={`Mark "${p.title}" as ${solved ? 'unsolved' : 'solved'}`}
        onClick={() => onToggleSolved(p.id)}
        className={`grid h-5 w-5 place-items-center rounded border transition-colors ${
          solved
            ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
            : 'border-zinc-300 bg-white hover:border-brand-500 dark:border-zinc-600 dark:bg-zinc-900'
        }`}
      >
        {solved && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-sm font-medium ${solved ? 'text-zinc-500 line-through decoration-zinc-400/70 dark:text-zinc-400' : ''}`}>
            <span className="mr-1 font-mono text-xs text-zinc-400 sm:hidden">{p.order}.</span>
            {p.title}
          </span>
          <DifficultyBadge value={p.difficulty} />
          {state.notes && <NotebookPen className="h-3.5 w-3.5 text-zinc-400" aria-label="Has notes" />}
        </div>
        {showTopic && (
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            Step {p.step} · {p.topic} › {p.subtopic}
          </p>
        )}
        {/* Mobile platform links */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sm:hidden">
          <PlatformLink href={lc?.url} label="LeetCode" title={lc?.title} compact>
            LeetCode
          </PlatformLink>
          <PlatformLink href={gfg?.url} label="GFG" title={gfg?.title} compact>
            GFG
          </PlatformLink>
        </div>
      </div>

      <div className="hidden sm:block">
        <PlatformLink
          href={lc?.url}
          label="LeetCode"
          title={lc ? `LeetCode: ${lc.title} (${lc.difficulty}${lc.premium ? ', Premium' : ''})` : undefined}
        >
          <span>LeetCode</span>
          {lc && <span className={`font-normal ${LC_DIFFICULTY_STYLES[lc.difficulty]}`}>{lc.difficulty[0]}</span>}
          {lc?.premium && <Lock className="h-3 w-3 text-amber-500" aria-label="Premium" />}
        </PlatformLink>
      </div>
      <div className="hidden sm:block">
        <PlatformLink href={gfg?.url} label="GFG" title={gfg ? `GeeksforGeeks: ${gfg.title}` : undefined}>
          GFG
        </PlatformLink>
      </div>

      <div className="flex items-center">
        <button
          className={`icon-btn ${state.bookmarked ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400' : ''}`}
          onClick={() => onToggleBookmark(p.id)}
          aria-pressed={state.bookmarked}
          aria-label={state.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          title={state.bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Star className="h-4 w-4" fill={state.bookmarked ? 'currentColor' : 'none'} />
        </button>
        <button className={`icon-btn ${state.notes ? 'text-brand-600 dark:text-brand-500' : ''}`} onClick={() => onOpenNotes(p)} aria-label="Notes" title="Notes">
          <NotebookPen className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default memo(ProblemRow);
