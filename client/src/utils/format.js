export const DIFFICULTY_STYLES = {
  Basic: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
  Core: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
  Pro: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
};

export const LC_DIFFICULTY_STYLES = {
  Easy: 'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Hard: 'text-rose-600 dark:text-rose-400',
};

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export function groupBySubtopic(problems) {
  const groups = new Map();
  for (const p of problems) {
    if (!groups.has(p.subtopic)) groups.set(p.subtopic, { name: p.subtopic, order: p.subtopicOrder, items: [] });
    groups.get(p.subtopic).items.push(p);
  }
  return [...groups.values()].sort((a, b) => a.order - b.order);
}
