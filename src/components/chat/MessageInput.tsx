'use client';

import React, { useState } from 'react';
import { Send, WifiOff } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState('');
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isOnline = useChatStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;

    const content = text;
    setText('');
    await sendMessage(conversationId, content, currentUser);
  };

  return (
    <div className="p-4 border-t border-white/10 bg-[#0d1322] relative">
      {!isOnline && (
        <div className="mb-2 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode: Outgoing messages will queue in IndexedDB and sync upon reconnection.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
