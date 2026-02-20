import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 fixed bottom-0 left-0 right-0 z-[100] animate-fade-in shadow-lg border-t border-gray-700">
        <WifiOff size={16} className="text-red-400" />
        <span>You are currently offline. Viewing cached data.</span>
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 fixed bottom-0 left-0 right-0 z-[100] animate-fade-in shadow-lg">
        <Wifi size={16} />
        <span>Back online! Syncing data...</span>
      </div>
    );
  }

  return null;
};

export default OfflineBanner;