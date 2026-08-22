'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Users, MessageSquare, LogOut, Loader2 } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSearchModal } from './UserSearchModal';
import { CreateGroupModal } from './CreateGroupModal';

export function ConversationList() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    isLoadingConversations,
  } = useChatStore();

  const { user: currentUser, logout } = useAuthStore();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = safeConversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (conv.type === 'group' && conv.name?.toLowerCase().includes(q)) return true;
    return conv.participants?.some((p) => p.name?.toLowerCase().includes(q));
  });

  return (
    <>
      <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#0d1322] border-r border-white/10 text-white">
        {/* User Profile Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-100">{currentUser?.name || 'User'}</h2>
              <p className="text-xs text-gray-400">{currentUser?.phone || ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons & Search */}
        <div className="p-4 space-y-3 border-b border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="px-3 py-2 rounded-xl glass-pill text-indigo-300 hover:text-white hover:bg-indigo-600/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-indigo-500/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              New Chat
            </button>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-3 py-2 rounded-xl glass-pill text-purple-300 hover:text-white hover:bg-purple-600/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-purple-500/30"
            >
              <Users className="w-3.5 h-3.5" />
              New Group
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;

              const participants = Array.isArray(conv?.participants) ? conv.participants : [];
              let title = conv?.name;
              if (conv?.type === 'direct') {
                const other = participants.find((p) => p?.id !== currentUser?.id) || participants[0];
                title = other?.name || 'Direct Chat';
              }

              const timeStr = conv.updatedAt
                ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold text-sm text-white shadow-md ${
                        conv.type === 'group'
                          ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                          : 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
                      }`}
                    >
                      {conv.type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        title?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-gray-100 truncate">{title}</h4>
                      <span className="text-[10px] text-gray-400">{timeStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 truncate">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                      {conv.unreadCount ? (
                        <span className="ml-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No conversations yet.</p>
              <p className="text-[10px] mt-1">Start a direct chat or group conversation above!</p>
            </div>
          )}
        </div>
      </div>

      <UserSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </>
  );
}
