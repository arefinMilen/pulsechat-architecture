'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { onSocketStatus, subscribeToSocketEvents } from '@/lib/socket';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageArea } from '@/components/chat/MessageArea';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, initializeAuth } = useAuthStore();
  const {
    activeConversationId,
    fetchConversations,
    receiveSocketMessage,
    setSocketStatus,
  } = useChatStore();

  useNetworkStatus();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isInitializing, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void fetchConversations();
    onSocketStatus(setSocketStatus);
    subscribeToSocketEvents(receiveSocketMessage);

    return () => onSocketStatus(null);
  }, [isAuthenticated, fetchConversations, receiveSocketMessage, setSocketStatus]);

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-[#090d16] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm">Restoring your session…</span>
      </div>
    );
  }

  return (
    // Master/detail: below `md` exactly one pane is mounted at full width, so
    // the list and the transcript never compete for a phone-sized viewport.
    <div className="h-dvh w-full bg-[#090d16] flex overflow-hidden">
      <div
        className={`${
          activeConversationId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 shrink-0`}
      >
        <ConversationList />
      </div>

      {activeConversationId ? (
        <MessageArea conversationId={activeConversationId} />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 text-sm px-6 text-center">
          Select a conversation from the left to view messages
        </div>
      )}
    </div>
  );
}
