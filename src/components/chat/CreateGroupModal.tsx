'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Search, Users, X } from 'lucide-react';
import { apiService, MIN_GROUP_PARTICIPANTS } from '@/lib/api-client';
import { apiError } from '@/lib/normalize';
import { User } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { initialsOf, userLabel } from '@/lib/display';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroupConversation = useChatStore((s) => s.createGroupConversation);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setSearchQuery('');
      setResults([]);
      setSelected([]);
      setError(null);
    }
  }, [isOpen]);

  // Debounced live search against the user directory.
  useEffect(() => {
    if (!isOpen) return;

    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const users = await apiService.searchUsers(searchQuery);
        if (cancelled) return;
        setResults(users.filter((u) => u.id && u.id !== currentUser?.id));
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(apiError(err));
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, isOpen, currentUser?.id]);

  const toggleUser = (user: User) => {
    setError(null);
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const hasEnoughMembers = selected.length >= MIN_GROUP_PARTICIPANTS;
  const canSubmit = groupName.trim().length > 0 && hasEnoughMembers && !isSubmitting;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createGroupConversation(
        groupName.trim(),
        selected.map((u) => u.id)
      );
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a group"
      icon={<Users className="w-5 h-5 text-purple-400 shrink-0" />}
    >
      <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
        <div>
          <label htmlFor="group-name" className="block text-xs font-medium text-gray-400 mb-1">
            Group name
          </label>
          <input
            id="group-name"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Core Engineering"
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {/* Selected members */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 text-[11px]"
              >
                <span className="truncate max-w-[9rem]">{userLabel(user)}</span>
                <button
                  type="button"
                  onClick={() => toggleUser(user)}
                  aria-label={`Remove ${userLabel(user)}`}
                  className="p-0.5 rounded-full hover:bg-white/15 text-indigo-200 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-baseline justify-between mb-1 gap-2">
            <label htmlFor="group-search" className="block text-xs font-medium text-gray-400">
              Add people
            </label>
            <span
              className={`text-[10px] ${
                hasEnoughMembers ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {selected.length} selected · {MIN_GROUP_PARTICIPANTS} minimum
            </span>
          </div>

          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="group-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone number…"
              className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {isSearching ? (
              <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-xs">Searching…</span>
              </div>
            ) : results.length > 0 ? (
              results.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user)}
                    aria-pressed={isSelected}
                    className={`w-full text-left flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50'
                        : 'hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-medium text-xs text-white shrink-0">
                        {initialsOf(userLabel(user))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">
                          {userLabel(user)}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{user.phone}</p>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-white/20 bg-black/40'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-center py-4 text-xs text-gray-500">
                {searchQuery.trim()
                  ? `No one found matching "${searchQuery}".`
                  : 'Search for people to add to the group.'}
              </p>
            )}
          </div>
        </div>

        {!hasEnoughMembers && (
          <p className="text-[11px] text-gray-500">
            A group needs at least {MIN_GROUP_PARTICIPANTS} other people — three members
            including you.
          </p>
        )}

        {error && (
          <p className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-all shadow-md flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
