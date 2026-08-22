'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { subscribeToSocketEvents } from '@/lib/socket';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageArea } from '@/components/chat/MessageArea';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const {
    activeConversationId,
    fetchConversations,
    receiveSocketMessage,
    updateConversationFromSocket,
  } = useChatStore();

  useOfflineQueue();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      subscribeToSocketEvents(receiveSocketMessage, updateConversationFromSocket);
    }
  }, [
    isAuthenticated,
    fetchConversations,
    receiveSocketMessage,
    updateConversationFromSocket,
  ]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-gray-400">
        <div className="animate-pulse text-sm">Loading PulseChat Session...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#090d16] flex overflow-hidden">
      {/* Sidebar Conversation List */}
      <ConversationList />

      {/* Main Chat Viewport */}
      {activeConversationId ? (
        <MessageArea conversationId={activeConversationId} />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 text-sm">
          Select a conversation from the left to view messages
        </div>
      )}
    </div>
  );
}
