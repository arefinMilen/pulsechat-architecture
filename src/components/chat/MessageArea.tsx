'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  MessageSquare,
  RotateCcw,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatScroll } from '../../hooks/useChatScroll';
import { MessageInput } from './MessageInput';
import { ScrollToBottomPill } from './ScrollToBottomPill';
import { GroupSettingsModal } from './GroupSettingsModal';
import {
  conversationTitle,
  indexParticipants,
  initialsOf,
  senderName,
} from '../../lib/display';

interface MessageAreaProps {
  conversationId: string;
}

/** Groups messages under a day heading so long transcripts stay readable. */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MessageArea({ conversationId }: MessageAreaProps) {
  const {
    conversations,
    messages,
    isLoadingMessages,
    messagesError,
    messageSearchQuery,
    setMessageSearchQuery,
    clearActiveConversation,
    fetchMessages,
    retryMessage,
  } = useChatStore();

  const currentUser = useAuthStore((s) => s.user);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const rawMessages = useMemo(
    () => messages[conversationId] || [],
    [messages, conversationId]
  );

  const filteredMessages = useMemo(() => {
    const q = messageSearchQuery.trim().toLowerCase();
    if (!q) return rawMessages;
    return rawMessages.filter((m) => m.text.toLowerCase().includes(q));
  }, [rawMessages, messageSearchQuery]);

  // Messages name their author by id only, so names are resolved against the
  // conversation's participants at render time.
  const participantsById = useMemo(
    () => indexParticipants(activeConv?.participants ?? []),
    [activeConv?.participants]
  );

  const { containerRef, isAtBottom, unreadCount, scrollToBottom } = useChatScroll({
    messages: rawMessages,
  });

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#090d16] text-gray-400 p-8 text-center">
        <MessageSquare className="w-12 h-12 mb-3 text-indigo-500/40" />
        <h3 className="text-base font-semibold text-gray-200">No conversation selected</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          Pick a contact or group from the list to read the history and send messages.
        </p>
      </div>
    );
  }

  const participants = activeConv.participants ?? [];
  const title = conversationTitle(activeConv, currentUser?.id);
  const isGroup = activeConv.type === 'group';

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#090d16] relative overflow-hidden">
      {/* Conversation header */}
      <header className="p-3 md:p-4 border-b border-white/10 bg-[#0d1322] flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={clearActiveConversation}
            aria-label="Back to conversations"
            className="md:hidden p-2 -ml-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0 ${
              isGroup
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                : 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
            }`}
          >
            {initialsOf(title)}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-100 truncate">{title}</h2>
            <p className="text-[11px] text-gray-400 truncate">
              {isGroup ? `${participants.length} participants` : 'Direct message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIsSearchOpen((open) => {
                if (open) setMessageSearchQuery('');
                return !open;
              });
            }}
            aria-label="Search messages in this conversation"
            aria-pressed={isSearchOpen}
            className={`p-2 rounded-xl border transition-colors ${
              isSearchOpen
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'glass-panel text-gray-400 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {isGroup && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Group settings"
              className="p-2 rounded-xl glass-panel text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* In-conversation search */}
      {isSearchOpen && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center gap-2 z-10">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
            placeholder="Search this conversation…"
            aria-label="Search this conversation"
            className="flex-1 min-w-0 bg-black/40 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-indigo-300/50 focus:outline-none focus:border-indigo-400"
            autoFocus
          />
          {messageSearchQuery && (
            <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full font-mono shrink-0">
              {filteredMessages.length} match{filteredMessages.length === 1 ? '' : 'es'}
            </span>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setMessageSearchQuery('');
            }}
            aria-label="Close search"
            className="p-1 rounded text-gray-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Transcript */}
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        aria-label="Message history"
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 space-y-3"
      >
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Loading messages…</span>
          </div>
        ) : messagesError ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
            <AlertCircle className="w-9 h-9 text-red-400/70" />
            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                Couldn&apos;t load this conversation
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">{messagesError}</p>
            </div>
            <button
              onClick={() => void fetchMessages(conversationId)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg, index) => {
            const isMe = !!currentUser?.id && msg.senderId === currentUser.id;
            const previous = filteredMessages[index - 1];
            const showDaySeparator =
              !previous || dayLabel(previous.createdAt) !== dayLabel(msg.createdAt);
            // Only label the first message in a run from the same person.
            const showSenderName =
              isGroup && !isMe && (!previous || previous.senderId !== msg.senderId);

            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <React.Fragment key={msg.id || msg.clientTempId}>
                {showDaySeparator && (
                  <div className="flex items-center justify-center py-2">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {dayLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showSenderName && (
                    <span className="text-[10px] text-indigo-300 ml-2 mb-1 font-medium">
                      {senderName(msg, participantsById)}
                    </span>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl shadow-md text-sm leading-relaxed ${
                      isMe
                        ? msg.status === 'failed'
                          ? 'bg-red-950/60 text-red-50 rounded-br-none border border-red-500/40'
                          : msg.status === 'sending'
                          ? 'bg-indigo-600/60 text-white rounded-br-none border border-indigo-400/30'
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
                      <time dateTime={msg.createdAt}>{timeStr}</time>
                      {isMe && (
                        <span aria-label={`Message ${msg.status ?? 'sent'}`}>
                          {msg.status === 'sending' ? (
                            <Clock className="w-3 h-3" />
                          ) : msg.status === 'failed' ? (
                            <AlertCircle className="w-3 h-3 text-red-300" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {isMe && msg.status === 'failed' && (
                    <button
                      onClick={() =>
                        currentUser &&
                        msg.clientTempId &&
                        void retryMessage(conversationId, msg.clientTempId, currentUser)
                      }
                      className="mt-1 mr-1 text-[10px] text-red-300 hover:text-red-200 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Not delivered — tap to retry
                    </button>
                  )}
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center py-12 px-6">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
            {messageSearchQuery.trim() ? (
              <>
                <p className="text-xs">No messages match your search.</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Try a different word or clear the search.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs">No messages yet.</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Say hello to start the conversation.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <ScrollToBottomPill
        isVisible={!isAtBottom}
        unreadCount={unreadCount}
        onClick={() => scrollToBottom('smooth')}
      />

      <MessageInput conversationId={conversationId} />

      {isGroup && (
        <GroupSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          conversation={activeConv}
        />
      )}
    </div>
  );
}
