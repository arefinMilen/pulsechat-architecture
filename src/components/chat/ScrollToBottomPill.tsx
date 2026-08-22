'use client';

import React from 'react';
import { ArrowDown } from 'lucide-react';

interface ScrollToBottomPillProps {
  isVisible: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function ScrollToBottomPill({ isVisible, unreadCount, onClick }: ScrollToBottomPillProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-20 right-6 z-20 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl backdrop-blur-md border border-indigo-400/30 text-xs font-semibold flex items-center gap-2 animate-bounce transition-all"
    >
      <ArrowDown className="w-4 h-4" />
      {unreadCount > 0 ? (
        <span>{unreadCount} New Message{unreadCount > 1 ? 's' : ''}</span>
      ) : (
        <span>Scroll to Latest</span>
      )}
    </button>
  );
}
