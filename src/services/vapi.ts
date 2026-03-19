// Vapi AI Voice Calling Integration (via Cloudflare Worker)
// API keys are stored server-side in the Cloudflare Worker

import type { AdvisorSession, AdvisorMessage } from '../types/pro';

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL || '';

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

export class VapiService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!WORKER_URL;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (!this.isConfigured) {
      return { 
        configured: false, 
        message: 'Cloudflare Worker URL not configured. Add VITE_CLOUDFLARE_WORKER_URL to your .env file.' 
      };
    }
    return { configured: true, message: 'Vapi AI calling connected via secure worker' };
  }

  async initiateCall(request: VapiCallRequest): Promise<VapiCallResponse> {
    if (!this.isConfigured) {
      throw new Error('Vapi not configured. Check VITE_CLOUDFLARE_WORKER_URL environment variable.');
    }

    try {
      const response = await fetch(`${WORKER_URL}/vapi/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      // Return the call data from the worker response
      return {
        id: data.callId || data.data?.id || '',
        status: data.status || data.data?.status || 'queued',
        phoneNumber: request.phoneNumber,
        ...data.data,
      };
    } catch (error) {
      console.error('Vapi call error:', error);
      throw error;
    }
  }

  async getCallStatus(callId: string): Promise<VapiCallResponse> {
    if (!this.isConfigured) {
      throw new Error('Vapi not configured.');
    }

    try {
      const response = await fetch(`${WORKER_URL}/vapi/status?callId=${encodeURIComponent(callId)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      return {
        id: callId,
        status: data.status || data.data?.status || 'unknown',
        ...data.data,
      };
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
