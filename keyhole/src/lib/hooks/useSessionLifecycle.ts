'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/lib/store/useAppStore';

export function useSessionLifecycle() {
  const { user, sessionId, setUser, setSessionId } = useAppStore();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // 1. Load persistent login state from localStorage
    try {
      const savedUser = localStorage.getItem('keyhole_user');
      const savedToken = localStorage.getItem('keyhole_access_token');
      if (savedUser) {
        setUser(JSON.parse(savedUser), savedToken);
      }
    } catch (e) {
      console.warn('Error reading persistent login state:', e);
    }

    // 2. Initialize fresh temporary session in sessionStorage (clean slate on new site visit)
    let currentSession = sessionStorage.getItem('keyhole_session_id');
    if (!currentSession) {
      currentSession = 'sess_' + uuidv4().substring(0, 12);
      sessionStorage.setItem('keyhole_session_id', currentSession);
    }
    setSessionId(currentSession);

    // 3. Verify auth session with backend
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        // If unauthorized and has refresh cookie, attempt refresh
        return fetch('/api/auth/refresh', { method: 'POST' }).then((r) =>
          r.ok ? r.json() : null
        );
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user, data.accessToken || null);
        }
      })
      .catch(() => {
        // network offline or unauthenticated
      });

    // 4. Register beforeunload listener (destroy temporary data, keep persistent login)
    const handleBeforeUnload = () => {
      const activeUser = useAppStore.getState().user;
      const activeSess = useAppStore.getState().sessionId;

      if (activeSess) {
        const payload = JSON.stringify({
          userId: activeUser?.id || 'anonymous',
          sessionId: activeSess,
        });

        // Use sendBeacon for guaranteed asynchronous cleanup during tab termination
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/cleanup-session',
            new Blob([payload], { type: 'application/json' })
          );
        }

        // Clear temporary sessionStorage only (leaving localStorage login state intact!)
        sessionStorage.clear();
      }
    };

    // 5. Register visibilitychange listener (notify server when tab is hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const activeUser = useAppStore.getState().user;
        const activeSess = useAppStore.getState().sessionId;

        if (activeSess && navigator.sendBeacon) {
          const payload = JSON.stringify({
            userId: activeUser?.id || 'anonymous',
            sessionId: activeSess,
          });
          navigator.sendBeacon(
            '/api/mark-session-inactive',
            new Blob([payload], { type: 'application/json' })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setUser, setSessionId]);
}
