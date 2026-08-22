'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  LogOut,
  MessageSquare,
  RotateCcw,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSearchModal } from './UserSearchModal';
import { CreateGroupModal } from './CreateGroupModal';
import { conversationTitle, initialsOf, listTimestamp } from '@/lib/display';

const STATUS_COPY = {
  connected: { label: 'Live', dot: 'bg-emerald-400' },
  connecting: { label: 'Connecting…', dot: 'bg-amber-400 animate-pulse' },
  disconnected: { label: 'Offline', dot: 'bg-red-400' },
} as const;

export function ConversationList() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    isLoadingConversations,
    conversationsError,
    fetchConversations,
    socketStatus,
  } = useChatStore();

  const { user: currentUser, logout } = useAuthStore();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conv) => {
      if (conversationTitle(conv, currentUser?.id).toLowerCase().includes(q)) return true;
      return conv.participants.some(
        (p) => p.name?.toLowerCase().includes(q) || p.phone?.includes(q)
      );
    });
  }, [conversations, searchQuery, currentUser?.id]);

  const status = STATUS_COPY[socketStatus];

  return (
    <>
      <div className="w-full flex flex-col h-full bg-[#0d1322] border-r border-white/10 text-white">
        {/* Signed-in user */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 bg-black/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shrink-0">
              {initialsOf(currentUser?.name || 'Me')}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-100 truncate">
                {currentUser?.name || 'User'}
              </h1>
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                <span className="truncate">{status.label}</span>
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="p-2 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Actions + filter */}
        <div className="p-4 space-y-3 border-b border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="px-3 py-2 rounded-xl glass-pill text-indigo-300 hover:text-white hover:bg-indigo-600/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-indigo-500/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              New chat
            </button>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-3 py-2 rounded-xl glass-pill text-purple-300 hover:text-white hover:bg-purple-600/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-purple-500/30"
            >
              <Users className="w-3.5 h-3.5" />
              New group
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter conversations…"
              aria-label="Filter conversations"
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Threads */}
        <nav aria-label="Conversations" className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading conversations…</span>
              <span className="text-[10px] text-gray-600 max-w-[14rem] text-center">
                The demo API sleeps when idle — the first load can take up to a minute.
              </span>
            </div>
          ) : conversationsError ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3 px-4">
              <AlertCircle className="w-8 h-8 text-red-400/70" />
              <p className="text-xs text-gray-300">Couldn&apos;t load your conversations</p>
              <p className="text-[10px] text-gray-500">{conversationsError}</p>
              <button
                onClick={() => void fetchConversations()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                Try again
              </button>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const title = conversationTitle(conv, currentUser?.id);
              const isGroup = conv.type === 'group';

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => void setActiveConversation(conv.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold text-sm text-white shadow-md shrink-0 ${
                      isGroup
                        ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                        : 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
                    }`}
                  >
                    {isGroup ? <Users className="w-5 h-5" /> : initialsOf(title)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-xs font-semibold text-gray-100 truncate">{title}</h3>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {listTimestamp(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-400 truncate">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                      {!!conv.unreadCount && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow shrink-0">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {searchQuery.trim() ? (
                <p className="text-xs">No conversations match “{searchQuery}”.</p>
              ) : (
                <>
                  <p className="text-xs">No conversations yet.</p>
                  <p className="text-[10px] mt-1">
                    Start a direct chat or create a group above.
                  </p>
                </>
              )}
            </div>
          )}
        </nav>
      </div>

      <UserSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </>
  );
}
