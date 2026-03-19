import { supabase } from '@/lib/supabase';
import { Result, createError } from '@/types/result';
import { sanitizeText, sanitizeRichText } from '@/lib/sanitize';
import type { Database } from '@/lib/database.types';
import type { 
  Message, 
  MessageThread, 
  MessageFormData,
  MessageStats,
  MessageStatus 
} from '../types/message.types';

// Type helpers for database tables
type MessagesRow = Database['public']['Tables']['messages']['Row'];

// Extended type with additional fields used in the app
interface MessagesRowExtended extends MessagesRow {
  thread_id?: string;
  content?: string;
}

const MESSAGES_TABLE = 'messages';

export interface MessageService {
  getThreads(userId: string): Promise<Result<MessageThread[]>>;
  getThreadById(threadId: string): Promise<Result<MessageThread>>;
  getMessagesByThread(threadId: string): Promise<Result<Message[]>>;
  sendMessage(userId: string, data: MessageFormData): Promise<Result<Message>>;
  markAsRead(messageId: string): Promise<Result<void>>;
  getUnreadCount(userId: string): Promise<Result<number>>;
  getMessageStats(userId: string): Promise<Result<MessageStats>>;
}

function mapDatabaseToMessage(data: any): Message {
  return {
    id: data.id,
    threadId: data.thread_id || data.landlord_user_id,
    senderId: data.sender_id || 'system',
    senderType: data.sender_type || 'system',
    content: data.tenant_message || data.content || '',
    status: (data.status as MessageStatus) || 'sent',
    createdAt: data.created_at || data.timestamp,
    readAt: data.read_at,
    attachments: data.attachments || [],
  };
}

export const messageService: MessageService = {
  async getThreads(userId: string) {
    try {
      // Get unique threads by grouping messages
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('landlord_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by tenant phone (acting as thread ID for now)
      const threadsMap = new Map<string, MessageThread>();
      
      ((data || []) as any[]).forEach(msg => {
        const threadId = msg.tenant_phone || 'unknown';
        
        if (!threadsMap.has(threadId)) {
          threadsMap.set(threadId, {
            id: threadId,
            tenantName: msg.tenant_name || 'Unknown Tenant',
            subject: `Conversation with ${msg.tenant_phone || 'Unknown'}`,
            lastMessageAt: msg.created_at,
            unreadCount: msg.landlord_responded ? 0 : 1,
            messages: [],
          });
        }
        
        const thread = threadsMap.get(threadId)!;
        thread.messages.push(mapDatabaseToMessage(msg));
        
        if (new Date(msg.created_at) > new Date(thread.lastMessageAt)) {
          thread.lastMessageAt = msg.created_at;
        }
        
        if (!msg.landlord_responded) {
          thread.unreadCount++;
        }
      });

      return Result.ok(Array.from(threadsMap.values()));
    } catch (error) {
      console.error('Error fetching message threads:', error);
      return Result.err(createError('THREADS_FETCH_ERROR', 'Failed to fetch message threads'));
    }
  },

  async getThreadById(threadId: string) {
    try {
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('tenant_phone', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return Result.err(createError('THREAD_NOT_FOUND', 'Thread not found'));
      }

      const messages = data as any[];
      const thread: MessageThread = {
        id: threadId,
        tenantName: messages[0].tenant_name || 'Unknown Tenant',
        subject: `Conversation with ${threadId}`,
        lastMessageAt: messages[messages.length - 1].created_at,
        unreadCount: messages.filter(m => !m.landlord_responded).length,
        messages: messages.map(mapDatabaseToMessage),
      };

      return Result.ok(thread);
    } catch (error) {
      console.error('Error fetching thread:', error);
      return Result.err(createError('THREAD_FETCH_ERROR', 'Failed to fetch thread'));
    }
  },

  async getMessagesByThread(threadId: string) {
    try {
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('tenant_phone', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages = (data || []).map(mapDatabaseToMessage);
      return Result.ok(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return Result.err(createError('MESSAGES_FETCH_ERROR', 'Failed to fetch messages'));
    }
  },

  async sendMessage(userId: string, data: MessageFormData) {
    try {
      // Sanitize message content before storage
      const sanitizedContent = sanitizeRichText(data.content);
      
      const { data: message, error } = await supabase
        .from(MESSAGES_TABLE)
        .insert({
          landlord_user_id: userId,
          tenant_phone: data.threadId,
          tenant_message: sanitizedContent,
          bot_response: '',
          type: 'landlord_reply',
          escalated: false,
          landlord_responded: true,
        } as any)
        .select()
        .single();

      if (error) throw error;

      return Result.ok(mapDatabaseToMessage(message));
    } catch (error) {
      console.error('Error sending message:', error);
      return Result.err(createError('MESSAGE_SEND_ERROR', 'Failed to send message'));
    }
  },

  async markAsRead(messageId: string) {
    try {
      const { error } = await (supabase
        .from(MESSAGES_TABLE) as any)
        .update({ 
          landlord_responded: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error marking message as read:', error);
      return Result.err(createError('MARK_READ_ERROR', 'Failed to mark message as read'));
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('landlord_user_id', userId)
        .eq('landlord_responded', false);

      if (error) throw error;

      return Result.ok(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return Result.err(createError('UNREAD_COUNT_ERROR', 'Failed to fetch unread count'));
    }
  },

  async getMessageStats(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('created_at, landlord_responded')
        .eq('landlord_user_id', userId);

      if (error) throw error;

      const messages = (data || []) as MessagesRow[];
      const totalThreads = new Set(messages.map(m => m.tenant_phone)).size;
      const unreadCount = messages.filter(m => !m.landlord_responded).length;
      const sentToday = messages.filter(m => m.created_at.startsWith(today)).length;
      
      // Calculate response rate (messages responded to / total messages)
      const respondedCount = messages.filter(m => m.landlord_responded).length;
      const responseRate = messages.length > 0 
        ? Math.round((respondedCount / messages.length) * 100) 
        : 100;

      const stats: MessageStats = {
        totalThreads,
        unreadCount,
        sentToday,
        responseRate,
      };

      return Result.ok(stats);
    } catch (error) {
      console.error('Error fetching message stats:', error);
      return Result.err(createError('MESSAGE_STATS_ERROR', 'Failed to fetch message statistics'));
    }
  }
};

export { messageService as default };
