import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';

/**
 * Mirrors browser connectivity into the chat store so the composer can tell the
 * user that a send will not go through right now.
 */
export function useNetworkStatus() {
  const setIsOnline = useChatStore((state) => state.setIsOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);
}
