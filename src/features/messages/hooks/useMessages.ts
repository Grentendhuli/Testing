import { useState, useEffect, useCallback } from 'react';
import { messageService } from '../services/messageService';
import type { Message, MessageThread, MessageFormData, MessageStats } from '../types/message.types';

interface UseMessagesReturn {
  threads: MessageThread[];
  currentThread: MessageThread | null;
  messageStats: MessageStats | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
  loadThread: (threadId: string) => Promise<void>;
  sendMessage: (data: MessageFormData) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<boolean>;
}

export function useMessages(userId: string | undefined): UseMessagesReturn {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [currentThread, setCurrentThread] = useState<MessageThread | null>(null);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [threadsResult, statsResult, unreadResult] = await Promise.all([
        messageService.getThreads(userId),
        messageService.getMessageStats(userId),
        messageService.getUnreadCount(userId),
      ]);

      if (threadsResult.success) {
        setThreads(threadsResult.data);
      } else {
        setError(threadsResult.error?.message || 'Failed to fetch threads');
      }

      if (statsResult.success) {
        setMessageStats(statsResult.data);
      }

      if (unreadResult.success) {
        setUnreadCount(unreadResult.data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Messages fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const loadThread = useCallback(async (threadId: string) => {
    setIsLoading(true);
    try {
      const result = await messageService.getThreadById(threadId);
      if (result.success) {
        setCurrentThread(result.data);
      } else {
        setError(result.error?.message || 'Failed to load thread');
      }
    } catch (err) {
      setError('Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data: MessageFormData): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const result = await messageService.sendMessage(userId, data);
      if (result.success) {
        await fetchThreads();
        // Reload current thread if we're in one
        if (currentThread?.id === data.threadId) {
          await loadThread(data.threadId!);
        }
        return true;
      } else {
        setError(result.error?.message || 'Failed to send message');
        return false;
      }
    } catch (err) {
      setError('Failed to send message');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchThreads, currentThread, loadThread]);

  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const result = await messageService.markAsRead(messageId);
      if (result.success) {
        await fetchThreads();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error marking as read:', err);
      return false;
    }
  }, [fetchThreads]);

  return {
    threads,
    currentThread,
    messageStats,
    unreadCount,
    isLoading,
    error,
    refreshThreads: fetchThreads,
    loadThread,
    sendMessage,
    markAsRead,
  };
}
