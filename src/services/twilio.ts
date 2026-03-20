// Twilio Phone Numbers Service
// Handles phone number selection for NYC area codes

const NYC_AREA_CODES = ['212', '646', '718', '917', '929'];

export interface PhoneNumber {
  id: string;
  phoneNumber: string;
  friendlyName: string;
  areaCode: string;
  locality: string; // e.g., "Manhattan", "Brooklyn"
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyCost: number;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  isConfigured: boolean;
}

// Mock phone numbers for NYC
const generateMockPhoneNumbers = (count: number = 5): PhoneNumber[] => {
  const numbers: PhoneNumber[] = [];
  const localities: Record<string, string> = {
    '212': 'Manhattan',
    '646': 'Manhattan',
    '718': 'Brooklyn/Queens',
    '917': 'NYC (all boroughs)',
    '929': 'Brooklyn/Queens/Staten Island',
  };

  for (let i = 0; i < count; i++) {
    const areaCode = NYC_AREA_CODES[i % NYC_AREA_CODES.length];
    const exchange = Math.floor(Math.random() * 900) + 100; // 100-999
    const subscriber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const fullNumber = `(${areaCode}) ${exchange}-${subscriber}`;

    numbers.push({
      id: `phone_${areaCode}_${i}_${Date.now()}`,
      phoneNumber: fullNumber,
      friendlyName: fullNumber,
      areaCode,
      locality: localities[areaCode] || 'NYC',
      capabilities: {
        voice: true,
        sms: true,
        mms: true,
      },
      monthlyCost: 1.15, // Twilio standard rate
    });
  }

  return numbers;
};

export class TwilioService {
  private config: TwilioConfig;

  constructor() {
    this.config = {
      accountSid: (import.meta as any).env?.VITE_TWILIO_ACCOUNT_SID || '',
      authToken: (import.meta as any).env?.VITE_TWILIO_AUTH_TOKEN || '',
      isConfigured: !!((import.meta as any).env?.VITE_TWILIO_ACCOUNT_SID && (import.meta as any).env?.VITE_TWILIO_AUTH_TOKEN),
    };
  }

  isReady(): boolean {
    return this.config.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (this.config.isConfigured) {
      return { configured: true, message: 'Twilio API connected' };
    }
    return {
      configured: false,
      message: 'Twilio not configured. Add VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN to your .env file.',
    };
  }

  // Get available NYC phone numbers (mock for now, real API integration would go here)
  async getAvailableNumbers(areaCode?: string): Promise<PhoneNumber[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const numbers = generateMockPhoneNumbers(6);

    if (areaCode && NYC_AREA_CODES.includes(areaCode)) {
      return numbers.filter(n => n.areaCode === areaCode).slice(0, 3);
    }

    return numbers;
  }

  // Search numbers by specific criteria
  async searchNumbers(criteria: { areaCode?: string; contains?: string }): Promise<PhoneNumber[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const numbers = generateMockPhoneNumbers(10);

    if (criteria.areaCode) {
      return numbers.filter(n => n.areaCode === criteria.areaCode);
    }

    if (criteria.contains) {
      return numbers.filter(n => n.phoneNumber.includes(criteria.contains!));
    }

    return numbers;
  }

  // Submit selected phone number
  async selectPhoneNumber(phoneNumberId: string, userProfile: { 
    email: string; 
    propertyAddress: string;
  }): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // In real implementation, this would:
      // 1. Purchase the number via Twilio API
      // 2. Configure webhook URLs for the number
      // 3. Associate it with the user's account

      const selectedNumber = generateMockPhoneNumbers(1)[0];

      return {
        success: true,
        phoneNumber: selectedNumber.phoneNumber,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reserve phone number. Please try again.',
      };
    }
  }

  // Get pricing information
  getPricing(): { 
    monthlyNumber: number; 
    inboundSms: number; 
    outboundSms: number;
    inboundVoice: number;
    outboundVoice: number;
  } {
    return {
      monthlyNumber: 1.15,
      inboundSms: 0.0075,
      outboundSms: 0.0075,
      inboundVoice: 0.0085,
      outboundVoice: 0.013,
    };
  }
}

// Singleton instance
export const twilioService = new TwilioService();

// Helper function to format phone number input
export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return value;
}

// Helper to validate US phone number
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && /^[2-9]\d{2}[2-9]\d{6}$/.test(cleaned);
}

export { NYC_AREA_CODES };
