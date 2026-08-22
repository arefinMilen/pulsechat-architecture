'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, WifiOff } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

interface MessageInputProps {
  conversationId: string;
}

const MAX_LENGTH = 2000;

export function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const isOnline = useChatStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);

  // Drafts are per-thread: switching conversations should not carry text over.
  useEffect(() => {
    setText('');
  }, [conversationId]);

  // Grow with the content up to a ceiling, then scroll internally.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const canSend = text.trim().length > 0 && !!currentUser && isOnline;

  const submit = () => {
    if (!canSend || !currentUser) return;
    const body = text;
    setText('');
    void sendMessage(conversationId, body, currentUser);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="p-3 md:p-4 border-t border-white/10 bg-[#0d1322] relative">
      {!isOnline && (
        <div
          role="status"
          className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>You&apos;re offline — messages can&apos;t be sent until you reconnect.</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor="message-input" className="sr-only">
          Type a message
        </label>
        <textarea
          id="message-input"
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isOnline ? 'Type a message…' : 'Offline'}
          className="flex-1 min-w-0 resize-none px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner leading-relaxed"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {text.length > MAX_LENGTH - 200 && (
        <p className="mt-1 text-right text-[10px] text-gray-500">
          {text.length} / {MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
