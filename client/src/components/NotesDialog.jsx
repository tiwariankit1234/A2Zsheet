import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSheet } from '../context/SheetContext';

const MAX = 2000;

export default function NotesDialog({ problem, onClose }) {
  const { getState, saveNotes } = useSheet();
  const initial = problem ? getState(problem.id).notes || '' : '';
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setText(initial);
    if (problem) setTimeout(() => ref.current?.focus(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (problem) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [problem, onClose]);

  if (!problem) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await saveNotes(problem.id, text.trim());
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-title"
        className="w-full max-w-lg rounded-t-2xl border border-zinc-200 bg-white p-4 shadow-xl sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">Notes</p>
            <h2 id="notes-title" className="font-semibold">
              {problem.title}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          ref={ref}
          className="input min-h-40 resize-y font-mono text-[13px]"
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="Approach, edge cases, complexity, things to revisit…"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-500">
            {text.length}/{MAX}
          </span>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || text.trim() === initial.trim()}>
              {saving ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
