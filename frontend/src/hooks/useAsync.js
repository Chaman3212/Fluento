import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client.js';

export function useAsync(fn, deps = []) {
  const [state, set] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn); fnRef.current = fn;
  const run = useCallback(async () => {
    set((s) => ({ ...s, loading: true, error: null }));
    try { set({ data: await fnRef.current(), loading: false, error: null }); }
    catch (e) { set({ data: null, loading: false, error: errorMessage(e) }); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { ...state, reload: run };
}
