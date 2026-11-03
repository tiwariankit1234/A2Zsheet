import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../services/api';
import { useSheet } from '../context/SheetContext';
import ProblemList, { ListHeader } from '../components/ProblemList';
import NotesDialog from '../components/NotesDialog';
import { EmptyState, ErrorState, Spinner } from '../components/ui';

export default function BookmarksPage() {
  const { progressVersion } = useSheet();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [notesFor, setNotesFor] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.bookmarks();
      setItems(res.items);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch after any change so newly un-bookmarked rows disappear.
  useEffect(() => {
    if (items) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressVersion]);

  const closeNotes = useCallback(() => setNotesFor(null), []);
  const shown = items;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookmarks</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Problems you starred, most recent first.</p>
      </div>
      {error ? (
        <ErrorState title="Could not load bookmarks" message={error} onRetry={load} />
      ) : !items ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <EmptyState icon={Star} title="No bookmarks yet">
          Star a problem on the <Link className="font-medium text-brand-700 underline dark:text-brand-500" to="/">sheet</Link> to keep it here.
        </EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <ListHeader />
          <ProblemList problems={shown} onOpenNotes={setNotesFor} showTopic />
        </div>
      )}
      <NotesDialog problem={notesFor} onClose={closeNotes} />
    </div>
  );
}
