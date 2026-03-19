// Messages Feature Barrel Export
export type { 
  Message,
  MessageThread,
  MessageStatus,
  MessageFormData,
  MessageAttachment,
  MessageTemplate,
  MessageStats
} from './types/message.types';

export { useMessages } from './hooks/useMessages';
export { messageService } from './services/messageService';
