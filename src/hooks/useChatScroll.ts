import { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface UseChatScrollOptions {
  messages: Message[];
  threshold?: number;
}

export function useChatScroll({ messages, threshold = 80 }: UseChatScrollOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesCount = useRef(messages.length);

  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom <= threshold;
  }, [threshold]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
    setIsAtBottom(true);
    setUnreadCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  }, [checkIfAtBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Dynamic scroll lock calculation when messages change
  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      const atBottom = checkIfAtBottom();
      if (atBottom) {
        scrollToBottom('smooth');
      } else {
        // User is scrolled up to read earlier messages -> lock scroll & increment unread pill count
        setUnreadCount((prev) => prev + (messages.length - prevMessagesCount.current));
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages, checkIfAtBottom, scrollToBottom]);

  return {
    containerRef,
    isAtBottom,
    unreadCount,
    scrollToBottom,
  };
}
