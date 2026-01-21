/**
 * REAL-TIME SYNC STATUS INDICATOR
 * 
 * Shows online/offline status and sync state for production confidence
 */

import React, { useState, useEffect } from 'react';
import { offlineDetector, NetworkStatus } from '../utils/offlineDetector';

interface SyncStatusProps {
  className?: string;
  showLabel?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ className = '', showLabel = true }) => {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineDetector.onStatusChange((newStatus) => {
      setStatus(newStatus);
      // Only show indicator if offline or slow
      setIsVisible(newStatus !== 'online');
    });

    return unsubscribe;
  }, []);

  if (!isVisible && status === 'online') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'offline':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          icon: '🔴',
          label: 'Offline',
          message: 'No internet connection. Actions disabled.'
        };
      case 'slow':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          icon: '🟡',
          label: 'Slow Connection',
          message: 'Connection is slow. Please wait...'
        };
      default:
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          icon: '🟢',
          label: 'Online',
          message: 'Real-time sync active'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color} ${config.textColor} text-sm font-medium ${className}`}>
      <span className="text-base">{config.icon}</span>
      {showLabel && (
        <>
          <span className="font-semibold">{config.label}</span>
          <span className="text-xs opacity-90">•</span>
          <span className="text-xs">{config.message}</span>
        </>
      )}
    </div>
  );
};

export default SyncStatus;
