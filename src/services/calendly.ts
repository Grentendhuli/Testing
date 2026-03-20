// Calendly API Integration for Advisor Scheduling
// https://developer.calendly.com - Schedule human advisor calls

import type { AdvisorSession } from '../types/pro';

export interface CalendlyConfig {
  personalAccessToken: string;
  userUri?: string;
  eventTypeUri?: string;
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  duration: number;
  description?: string;
}

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  event_type: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'canceled';
  location?: {
    type: string;
    location?: string;
    join_url?: string;
  };
  invitees: Array<{
    email: string;
    name: string;
    status: 'active' | 'canceled';
  }>;
}

export interface CalendlyInvitee {
  email: string;
  name: string;
  questions_and_answers?: Array<{
    question: string;
    answer: string;
  }>;
}

const CALENDLY_API_BASE = 'https://api.calendly.com/v2';

export class CalendlyService {
  private token: string;
  private userUri?: string;
  private eventTypeUri?: string;
  private isConfigured: boolean;

  constructor(config?: CalendlyConfig) {
    this.token = config?.personalAccessToken || (import.meta as any).env?.VITE_CALENDLY_TOKEN || '';
    this.userUri = config?.userUri || (import.meta as any).env?.VITE_CALENDLY_USER_URI;
    this.eventTypeUri = config?.eventTypeUri || (import.meta as any).env?.VITE_CALENDLY_EVENT_TYPE_URI;
    this.isConfigured = !!this.token;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (!this.token) {
      return { 
        configured: false, 
        message: 'Calendly token not configured. Add VITE_CALENDLY_TOKEN to your .env file.' 
      };
    }
    if (!this.eventTypeUri) {
      return { 
        configured: false, 
        message: 'Calendly event type URI not configured. Add VITE_CALENDLY_EVENT_TYPE_URI to your .env file.' 
      };
    }
    return { configured: true, message: 'Calendly scheduling connected' };
  }

  async getCurrentUser(): Promise<{ uri: string; name: string; email: string }> {
    if (!this.isConfigured) {
      throw new Error('Calendly not configured');
    }

    try {
      const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.userUri = data.resource.uri;
      return data.resource;
    } catch (error) {
      console.error('Calendly user error:', error);
      throw error;
    }
  }

  async getEventTypes(): Promise<CalendlyEventType[]> {
    if (!this.isConfigured) {
      throw new Error('Calendly not configured');
    }

    if (!this.userUri) {
      await this.getCurrentUser();
    }

    try {
      const response = await fetch(
        `${CALENDLY_API_BASE}/event_types?user=${encodeURIComponent(this.userUri!)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Calendly event types error:', error);
      throw error;
    }
  }

  async getScheduledEvents(status: 'active' | 'canceled' = 'active'): Promise<CalendlyScheduledEvent[]> {
    if (!this.isConfigured) {
      throw new Error('Calendly not configured');
    }

    if (!this.userUri) {
      await this.getCurrentUser();
    }

    try {
      const url = new URL(`${CALENDLY_API_BASE}/scheduled_events`);
      url.searchParams.append('user', this.userUri!);
      url.searchParams.append('status', status);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Calendly scheduled events error:', error);
      throw error;
    }
  }

  async getSchedulingUrl(
    email: string,
    name: string,
    customAnswers?: Record<string, string>
  ): Promise<string> {
    if (!this.eventTypeUri) {
      throw new Error('Event type URI not configured');
    }

    // Extract UUID from URI
    const eventTypeUuid = this.eventTypeUri.split('/').pop();
    
    // Build scheduling link
    const baseUrl = `https://calendly.com/${eventTypeUuid}`;
    const params = new URLSearchParams({
      email,
      name,
      ...customAnswers,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  createAdvisorSession(event: CalendlyScheduledEvent, userId: string): AdvisorSession {
    return {
      id: `calendly_${event.uri.split('/').pop()}`,
      userId,
      scheduledAt: event.start_time,
      duration: Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000),
      status: event.status === 'active' ? 'scheduled' : 'cancelled',
      notes: 'Scheduled via Calendly',
      advisorName: 'Human Property Advisor',
      meetingLink: event.location?.join_url || event.location?.location,
    };
  }

  // Generate inline scheduling widget URL
  getWidgetUrl(): string {
    if (!this.eventTypeUri) {
      throw new Error('Event type URI not configured');
    }
    const eventTypeUuid = this.eventTypeUri.split('/').pop();
    return `https://calendly.com/${eventTypeUuid}?embed_type=Inline&hide_event_type_details=1`;
  }
}

// Singleton instance
export const calendlyService = new CalendlyService();
