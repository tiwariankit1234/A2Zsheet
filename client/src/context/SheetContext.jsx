import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SheetContext = createContext(null);
const EMPTY = { solved: false, bookmarked: false, notes: '' };

// Loads the sheet (topics + every problem) once, and the signed-in user's progress.
// Mutations are optimistic: the UI updates instantly and rolls back if the API call fails.
export function SheetProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState(() => new Map());
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [progressVersion, setProgressVersion] = useState(0);
  const pending = useRef(new Set());

  const loadSheet = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [t, p] = await Promise.all([api.topics(), api.problems({ limit: 500 })]);
      setTopics(t.items);
      setProblems(p.items);
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      const res = await api.progress();
      setProgress(new Map(res.items.map((i) => [i.problemId, i])));
    } catch (e) {
      toast.error(`Could not load your progress: ${e.message}`);
    }
  }, [toast]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  useEffect(() => {
    if (user?.id) loadProgress();
    else setProgress(new Map());
  }, [user?.id, loadProgress]);

  const getState = useCallback((id) => progress.get(id) || EMPTY, [progress]);

  const patch = useCallback(
    async (id, change, request, successMsg) => {
      const key = `${id}:${Object.keys(change).join(',')}`;
      if (pending.current.has(key)) return;
      pending.current.add(key);
      const before = progress.get(id);
      setProgress((m) => new Map(m).set(id, { ...EMPTY, ...m.get(id), problemId: id, ...change }));
      try {
        const saved = await request();
        setProgress((m) => new Map(m).set(id, { ...m.get(id), ...saved }));
        setProgressVersion((v) => v + 1);
        if (successMsg) toast.success(successMsg);
      } catch (e) {
        setProgress((m) => {
          const next = new Map(m);
          if (before) next.set(id, before);
          else next.delete(id);
          return next;
        });
        toast.error(`Not saved: ${e.message}`);
      } finally {
        pending.current.delete(key);
      }
    },
    [progress, toast]
  );

  const toggleSolved = useCallback(
    (id) => {
      const solved = !getState(id).solved;
      return patch(id, { solved }, () => api.setProgress(id, { solved }));
    },
    [getState, patch]
  );

  const toggleBookmark = useCallback(
    (id) => {
      const bookmarked = !getState(id).bookmarked;
      return patch(id, { bookmarked }, () => api.setBookmark(id, bookmarked), bookmarked ? 'Bookmarked' : 'Bookmark removed');
    },
    [getState, patch]
  );

  const saveNotes = useCallback(
    (id, notes) => patch(id, { notes }, () => api.setProgress(id, { notes }), 'Notes saved'),
    [patch]
  );

  // Computed locally from the progress map so counts update the instant a box is ticked.
  const summary = useMemo(() => {
    const solvedIds = new Set([...progress.values()].filter((p) => p.solved).map((p) => p.problemId));
    const byStep = new Map(topics.map((t) => [t.step, 0]));
    const bySub = new Map();
    for (const p of problems) {
      if (!solvedIds.has(p.id)) continue;
      byStep.set(p.step, (byStep.get(p.step) || 0) + 1);
      const k = `${p.step}|${p.subtopic}`;
      bySub.set(k, (bySub.get(k) || 0) + 1);
    }
    const total = problems.length;
    const solved = problems.filter((p) => solvedIds.has(p.id)).length;
    const byDifficulty = {};
    for (const p of problems) {
      const d = p.difficulty || 'Unrated';
      byDifficulty[d] ??= { total: 0, solved: 0 };
      byDifficulty[d].total += 1;
      if (solvedIds.has(p.id)) byDifficulty[d].solved += 1;
    }
    return {
      total,
      solved,
      remaining: total - solved,
      percentage: total ? (solved / total) * 100 : 0,
      bookmarked: [...progress.values()].filter((p) => p.bookmarked).length,
      solvedInStep: (step) => byStep.get(step) || 0,
      solvedInSubtopic: (step, sub) => bySub.get(`${step}|${sub}`) || 0,
      byDifficulty,
    };
  }, [progress, problems, topics]);

  const value = useMemo(
    () => ({
      topics,
      problems,
      status,
      error,
      reload: loadSheet,
      getState,
      toggleSolved,
      toggleBookmark,
      saveNotes,
      summary,
      progressVersion,
    }),
    [topics, problems, status, error, loadSheet, getState, toggleSolved, toggleBookmark, saveNotes, summary, progressVersion]
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('useSheet must be used inside <SheetProvider>');
  return ctx;
}
