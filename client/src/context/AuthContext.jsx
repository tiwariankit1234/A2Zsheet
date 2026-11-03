import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, tokenStore } from '../services/api';

const AuthContext = createContext(null);

// Every visitor gets a session: either a saved account or an anonymous guest created on first visit.
// Guest progress is stored on the server and carried over when the guest registers or logs in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  const guestRequest = useRef(null);

  // De-duplicated so React StrictMode's double effect run doesn't create two guests.
  const startGuest = useCallback(async () => {
    guestRequest.current ??= api.guest().finally(() => {
      guestRequest.current = null;
    });
    const { token, user: u } = await guestRequest.current;
    tokenStore.set(token);
    setUser(u);
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      if (tokenStore.get()) {
        try {
          const { user: u } = await api.me();
          setUser(u);
        } catch (e) {
          if (e.status !== 401) throw e;
          tokenStore.set(null);
          await startGuest();
        }
      } else {
        await startGuest();
      }
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [startGuest]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const applySession = ({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  };

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      retry: bootstrap,
      login: async (body) => applySession(await api.login(body)),
      register: async (body) => applySession(await api.register(body)),
      logout: async () => {
        tokenStore.set(null);
        setUser(null);
        await startGuest();
      },
    }),
    [user, status, error, bootstrap, startGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
