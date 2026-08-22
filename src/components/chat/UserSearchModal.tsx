'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, MessageSquare, Search, UserPlus } from 'lucide-react';
import { apiService } from '@/lib/api-client';
import { apiError } from '@/lib/normalize';
import { User } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { initialsOf, userLabel } from '@/lib/display';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const startDirectConversation = useChatStore((s) => s.startDirectConversation);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const users = await apiService.searchUsers(query);
        if (cancelled) return;
        // Never offer to start a conversation with yourself.
        setResults(users.filter((u) => u.id && u.id !== currentUser?.id));
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(apiError(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, currentUser?.id]);

  const handleSelectUser = async (userId: string) => {
    setStartingId(userId);
    setError(null);
    try {
      await startDirectConversation(userId);
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setStartingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start a conversation"
      icon={<UserPlus className="w-5 h-5 text-indigo-400 shrink-0" />}
    >
      <div className="mt-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone number…"
          aria-label="Search by name or phone number"
          className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          autoFocus
        />
      </div>

      {error && (
        <p className="mt-3 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-sm">Searching…</span>
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <button
              key={user.id}
              type="button"
              disabled={!!startingId}
              onClick={() => void handleSelectUser(user.id)}
              className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors border border-transparent hover:border-indigo-500/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-medium text-sm text-white shadow-md shrink-0">
                  {initialsOf(userLabel(user))}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{userLabel(user)}</p>
                  <p className="text-xs text-gray-400 truncate">{user.phone}</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 shrink-0">
                {startingId === user.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5" />
                )}
                Chat
              </span>
            </button>
          ))
        ) : query.trim() ? (
          <div className="text-center py-8 px-2">
            <p className="text-gray-400 text-sm">No one found matching &quot;{query}&quot;.</p>
            {/* Names match from the start and numbers must be exact, so a
                partial query legitimately returns nothing. */}
            <p className="text-gray-500 text-xs mt-2">
              Search matches the start of a name, or a complete phone number.
            </p>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500 text-sm">
            Search by the start of someone&apos;s name, or their full phone number.
          </p>
        )}
      </div>
    </Modal>
  );
}
