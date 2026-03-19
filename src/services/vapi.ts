// Vapi AI Voice Calling Integration
// https://vapi.ai - AI-powered voice calling for business automation

import type { AdvisorSession, AdvisorMessage } from '../types/pro';

export interface VapiConfig {
  apiKey: string;
  assistantId: string;
  phoneNumberId?: string;
}

export interface VapiCallRequest {
  phoneNumber: string;
  userId: string;
  sessionType: 'portfolio-review' | 'emergency' | 'maintenance' | 'general';
  notes?: string;
  scheduledAt?: string;
}

export interface VapiCallResponse {
  id: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  phoneNumber?: string;
  duration?: number;
  recordingUrl?: string;
  summary?: string;
  transcript?: string;
  error?: string;
}

export const VAPI_API_BASE = 'https://api.vapi.ai';

export class VapiService {
  private apiKey: string;
  private assistantId: string;
  private phoneNumberId?: string;
  private isConfigured: boolean;

  constructor(config?: VapiConfig) {
    this.apiKey = config?.apiKey || import.meta.env.VITE_VAPI_API_KEY || '';
    this.assistantId = config?.assistantId || import.meta.env.VITE_VAPI_ASSISTANT_ID || '';
    this.phoneNumberId = config?.phoneNumberId || import.meta.env.VITE_VAPI_PHONE_NUMBER_ID;
    this.isConfigured = !!(this.apiKey && this.assistantId);
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (!this.apiKey) {
      return { 
        configured: false, 
        message: 'Vapi API key not configured. Add VITE_VAPI_API_KEY to your .env file.' 
      };
    }
    if (!this.assistantId) {
      return { 
        configured: false, 
        message: 'Vapi Assistant ID not configured. Add VITE_VAPI_ASSISTANT_ID to your .env file.' 
      };
    }
    return { configured: true, message: 'Vapi AI calling connected' };
  }

  async initiateCall(request: VapiCallRequest): Promise<VapiCallResponse> {
    if (!this.isConfigured) {
      throw new Error('Vapi not configured. Check environment variables.');
    }

    const url = `${VAPI_API_BASE}/call`;
    
    const customerData = {
      userId: request.userId,
      sessionType: request.sessionType,
      notes: request.notes,
    };

    const body: Record<string, unknown> = {
      assistantId: this.assistantId,
      name: `Advisor Call - ${request.sessionType}`,
      customer: {
        number: request.phoneNumber,
        ...customerData,
      },
      metadata: customerData,
    };

    if (this.phoneNumberId) {
      body.phoneNumberId = this.phoneNumberId;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: VapiCallResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Vapi call error:', error);
      throw error;
    }
  }

  async getCallStatus(callId: string): Promise<VapiCallResponse> {
    if (!this.isConfigured) {
      throw new Error('Vapi not configured.');
    }

    const url = `${VAPI_API_BASE}/call/${callId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching call status:', error);
      throw error;
    }
  }

  createAdvisorSession(
    userId: string,
    callResponse: VapiCallResponse,
    notes?: string
  ): AdvisorSession {
    return {
      id: `session_${callResponse.id}`,
      userId,
      scheduledAt: new Date().toISOString(),
      duration: callResponse.duration || 15,
      status: callResponse.status === 'completed' ? 'completed' : 'scheduled',
      notes,
      advisorName: 'AI Property Advisor',
      meetingLink: callResponse.recordingUrl,
      recordingUrl: callResponse.recordingUrl,
    };
  }

  async sendMessage(
    userId: string,
    advisorId: string,
    content: string,
    fromAdvisor: boolean = false
  ): Promise<AdvisorMessage> {
    return {
      id: `msg_${Date.now()}`,
      userId,
      advisorId,
      content,
      sentAt: new Date().toISOString(),
      fromAdvisor,
      read: false,
    };
  }
}

// Fallback for demo when Vapi is not configured
export class MockAdvisorService {
  private mockSessions: AdvisorSession[] = [];
  private mockMessages: AdvisorMessage[] = [];

  async initiateMockCall(userId: string, type: string): Promise<{
    session: AdvisorSession;
    message: string;
  }> {
    const session: AdvisorSession = {
      id: `session_${Date.now()}`,
      userId,
      scheduledAt: new Date().toISOString(),
      duration: 15,
      status: 'completed',
      notes: `Demo AI ${type} call`,
      advisorName: 'AI Property Advisor (Demo)',
    };

    this.mockSessions.push(session);

    const message: AdvisorMessage = {
      id: `msg_${Date.now()}`,
      userId,
      advisorId: 'ai_advisor',
      content: `This is a demo call. In production, this would connect to Vapi AI for a real voice conversation about your ${type}.`,
      sentAt: new Date().toISOString(),
      fromAdvisor: true,
      read: false,
    };

    this.mockMessages.push(message);

    return {
      session,
      message: 'Demo call completed successfully',
    };
  }

  getMockSessions(): AdvisorSession[] {
    return this.mockSessions;
  }

  getMockMessages(userId: string): AdvisorMessage[] {
    return this.mockMessages.filter(m => m.userId === userId);
  }
}

// Singleton instance
export const vapiService = new VapiService();
export const mockAdvisorService = new MockAdvisorService();
