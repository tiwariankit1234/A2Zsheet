import { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * Runs a filtered/sorted/search query against GET /api/problems (or /api/problems/search).
 * Returns null results when `active` is false so the caller can show the full sheet instead.
 */
export default function useProblemQuery(params, active, refreshKey) {
  const [state, setState] = useState({ items: null, total: 0, loading: false, error: null });
  const key = JSON.stringify(params);

  useEffect(() => {
    if (!active) {
      setState({ items: null, total: 0, loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { q, ...rest } = JSON.parse(key);
    const request = q ? api.search(q, { ...rest, limit: 500 }) : api.problems({ ...rest, limit: 500 });
    request
      .then((res) => !cancelled && setState({ items: res.items, total: res.pagination.total, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ items: null, total: 0, loading: false, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key, active, refreshKey]);

  return state;
}
