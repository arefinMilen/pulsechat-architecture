'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus, Loader2, MessageSquare } from 'lucide-react';
import { apiService } from '@/lib/api-client';
import { User } from '@/types';
import { useChatStore } from '@/store/useChatStore';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const startDirectConversation = useChatStore((s) => s.startDirectConversation);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const users = await apiService.searchUsers(query);
      setResults(users);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectUser = async (userId: string) => {
    await startDirectConversation(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">Start New Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone number..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-sm">Searching users directory...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-indigo-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-medium text-sm text-white shadow-md">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-100">{user.name}</h4>
                    <p className="text-xs text-gray-400">{user.phone}</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat
                </button>
              </div>
            ))
          ) : query.trim() ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No contacts found matching &quot;{query}&quot;
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Type a name or phone number to search contacts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
