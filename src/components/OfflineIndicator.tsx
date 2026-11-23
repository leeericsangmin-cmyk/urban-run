import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[#2b2b2e] text-[#faf8f3] border-2 border-[#faf8f3] px-3 py-1.5 rounded-lg text-xs font-sketch font-bold shadow-lg animate-in fade-in"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>OFFLINE MODE — 100% CACHED STANDALONE</span>
    </div>
  );
};
