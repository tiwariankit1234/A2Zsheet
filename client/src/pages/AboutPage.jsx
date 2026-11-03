import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ErrorState, Spinner } from '../components/ui';

export default function AboutPage() {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    api.meta().then(setMeta).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error) return <ErrorState title="Could not load dataset details" message={error} onRetry={load} />;
  if (!meta) return <Spinner />;
  const t = meta.totals;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data notes</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Where the problem list and links come from, and what could not be verified. Snapshot taken {meta.snapshotDate}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Problems', t.problems],
          ['With LeetCode', t.withLeetcode],
          ['With GFG', t.withGfg],
          ['No external link', t.noPlatformLink],
        ].map(([label, n]) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-mono text-xl font-semibold">{n}</p>
          </div>
        ))}
      </div>

      <section className="card space-y-2 p-5 text-sm leading-relaxed">
        <h2 className="font-semibold">How the data was built</h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          {meta.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          <li>
            Levels shown as <b>Basic / Core / Pro</b> are the reference sheet&apos;s own levels. LeetCode&apos;s Easy/Medium/Hard is shown next to each LeetCode
            link.
          </li>
          <li>
            &quot;Not available&quot; means no matching problem could be verified on that platform. Many sheet problems (patterns, linked-list basics, etc.) only
            exist on the reference site&apos;s own judge.
          </li>
          <li>
            {t.excludedLessons} lesson/article entries from the reference sheet (theory videos and articles) are left out, since this app tracks problems only.
          </li>
        </ul>
        <p className="pt-1 text-xs text-zinc-500">
          Source:{' '}
          <a className="underline" href={meta.source} target="_blank" rel="noopener noreferrer">
            {meta.source}
          </a>
          . This is an independent study tracker and is not affiliated with takeUforward, LeetCode or GeeksforGeeks.
        </p>
      </section>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-semibold">Links that could not be verified ({meta.unverified.length})</h2>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {meta.unverified.map((u) => (
            <li key={`${u.id}-${u.platform}`} className="py-2">
              <span className="font-medium">{u.title}</span>{' '}
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase dark:bg-zinc-800">{u.platform}</span>
              <p className="text-xs text-zinc-500">{u.reason}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
