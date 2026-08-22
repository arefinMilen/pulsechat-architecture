'use client';

import React, { useState } from 'react';
import { Settings, Search, Clock, Check, AlertCircle, Loader2, MessageSquare, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatScroll } from '../../hooks/useChatScroll';
import { MessageInput } from './MessageInput';
import { ScrollToBottomPill } from './ScrollToBottomPill';
import { GroupSettingsModal } from './GroupSettingsModal';

interface MessageAreaProps {
  conversationId: string;
}

export function MessageArea({ conversationId }: MessageAreaProps) {
  const { conversations, messages, isLoadingMessages, messageSearchQuery, setMessageSearchQuery } = useChatStore();
  const currentUser = useAuthStore((s) => s.user);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const rawMessages = messages[conversationId] || [];

  // Filter messages for full-text search engine
  const filteredMessages = rawMessages.filter((m) => {
    if (!messageSearchQuery.trim()) return true;
    return m.text.toLowerCase().includes(messageSearchQuery.toLowerCase());
  });

  const { containerRef, isAtBottom, unreadCount, scrollToBottom } = useChatScroll({
    messages: rawMessages,
  });

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#090d16] text-gray-400 p-8 text-center">
        <MessageSquare className="w-12 h-12 mb-3 text-indigo-500/40" />
        <h3 className="text-base font-semibold text-gray-200">No Active Conversation Selected</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          Select a contact or group from the sidebar to view chat history and send messages.
        </p>
      </div>
    );
  }

  const participants = Array.isArray(activeConv.participants) ? activeConv.participants : [];
  let title = activeConv.name;
  if (activeConv.type === 'direct') {
    const other = participants.find((p) => p?.id !== currentUser?.id) || participants[0];
    title = other?.name || 'Direct Chat';
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] relative overflow-hidden">
      {/* Top Conversation Header */}
      <div className="p-4 border-b border-white/10 bg-[#0d1322] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-md ${
              activeConv.type === 'group'
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                : 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
            }`}
          >
            {title?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
            <p className="text-[11px] text-gray-400">
              {activeConv.type === 'group'
                ? `${participants.length} participants`
                : 'Direct Message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl border transition-colors ${
              isSearchOpen
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'glass-panel text-gray-400 hover:text-white hover:bg-white/10 border-white/10'
            }`}
            title="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {activeConv.type === 'group' && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl glass-panel text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              title="Group Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Full-Text In-Chat Search Bar */}
      {isSearchOpen && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center gap-2 z-10 animate-in slide-in-from-top-2 duration-200">
          <Search className="w-4 h-4 text-indigo-400" />
          <input
            type="text"
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
            placeholder="Search full message history..."
            className="flex-1 bg-black/40 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-indigo-300/50 focus:outline-none focus:border-indigo-400"
            autoFocus
          />
          {messageSearchQuery && (
            <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
              {filteredMessages.length} match{filteredMessages.length === 1 ? '' : 'es'}
            </span>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setMessageSearchQuery('');
            }}
            className="p-1 rounded text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message List Stream Container */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Fetching message history...</span>
          </div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
              >
                {!isMe && msg.sender && (
                  <span className="text-[10px] text-gray-400 ml-2 mb-1 font-medium">
                    {msg.sender.name}
                  </span>
                )}

                <div
                  className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl shadow-md text-sm leading-relaxed ${
                    isMe
                      ? msg.status === 'sending'
                        ? 'bg-indigo-600/70 text-white rounded-br-none border border-indigo-400/30'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none'
                      : 'bg-[#151d30] text-gray-100 border border-white/10 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                  <div
                    className={`flex items-center gap-1 text-[10px] mt-1 justify-end ${
                      isMe ? 'text-indigo-200' : 'text-gray-400'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      <span>
                        {msg.status === 'sending' ? (
                          <Clock className="w-3 h-3 animate-spin" />
                        ) : msg.status === 'failed' ? (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center py-12">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
            <p className="text-xs">No messages found.</p>
            <p className="text-[10px] text-gray-600 mt-1">Send a message below to start chatting!</p>
          </div>
        )}
      </div>

      {/* Floating Scroll Lock Action Pill */}
      <ScrollToBottomPill
        isVisible={!isAtBottom}
        unreadCount={unreadCount}
        onClick={() => scrollToBottom('smooth')}
      />

      {/* Bottom Message Input Form */}
      <MessageInput conversationId={conversationId} />

      {/* Group Settings Modal */}
      {activeConv.type === 'group' && (
        <GroupSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          conversation={activeConv}
        />
      )}
    </div>
  );
}
