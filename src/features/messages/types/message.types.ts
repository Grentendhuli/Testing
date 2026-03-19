// Messages Feature Types

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderType: 'landlord' | 'tenant' | 'system';
  content: string;
  status: MessageStatus;
  createdAt: string;
  readAt?: string;
  attachments?: MessageAttachment[];
}

export interface MessageThread {
  id: string;
  unitId?: string;
  tenantId?: string;
  tenantName?: string;
  subject: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface MessageFormData {
  threadId?: string;
  content: string;
  unitId?: string;
  tenantId?: string;
  subject?: string;
  attachments?: File[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'welcome' | 'payment' | 'maintenance' | 'lease' | 'general';
  variables: string[];
}

export interface MessageStats {
  totalThreads: number;
  unreadCount: number;
  sentToday: number;
  responseRate: number;
}
