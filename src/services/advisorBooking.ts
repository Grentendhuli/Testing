// Advisor Booking and Profile Service
// Manages advisor sessions, profiles, and scheduling

import type { AdvisorSession } from '../types/pro';

export interface AdvisorProfile {
  id: string;
  name: string;
  title: string;
  credentials: string[];
  bio: string;
  specialties: string[];
  languages: string[];
  yearsExperience: number;
  photoUrl?: string;
  email: string;
  phone?: string;
  availableDays: string[];
  availableHours: {
    start: string;
    end: string;
  };
  maxCallsPerWeek: number;
  currentWeeklyBookings: number;
  isAvailable: boolean;
  tier: 'pro' | 'elite';
  rating: number;
  reviewCount: number;
  certifications: string[];
  verified: boolean;
}

export interface BookingRequest {
  advisorId: string;
  userId: string;
  requestedTime: string;
  duration: 15 | 30 | 60;
  topic: string;
  notes?: string;
  timezone: string;
}

export interface BookingResponse {
  success: boolean;
  sessionId?: string;
  meetingLink?: string;
  advisorName?: string;
  scheduledAt?: string;
  duration?: number;
  error?: string;
  alternatives?: string[];
}

// NYC Pro Concierge - Lead Advisor Profile
export const GRENTEN_DHULI_PROFILE: AdvisorProfile = {
  id: 'advisor_nyc_pro_concierge',
  name: 'NYC Pro Advisor',
  title: 'Licensed NYC Property Manager & Real Estate Professional',
  credentials: [
    'NYS Licensed Real Estate Professional',
    '10+ Years NYC Residential & Commercial Portfolio Management',
    'Luxury Rentals, Co-ops, Condos & Mixed-Use Properties',
    'Private Equity Portfolio Management Experience',
    'NYC Compliance Specialist — HPD, DHCR, Good Cause Eviction',
  ],
  bio: `Our NYC Pro Concierge advisor is a licensed New York State real estate professional with over 10 years of hands-on portfolio management experience across residential and commercial properties throughout the five boroughs.

**Career Background:**
Leasing Agent → Leasing Manager → Assistant PM → Property Manager → Senior Portfolio Manager

**Current Focus:** Advisory services for independent NYC landlords navigating compliance, tenant relations, and portfolio growth.

**Specialty Areas:**
• High-end luxury rentals throughout NYC
• Co-op and Condo management
• Commercial spaces & mixed-use properties
• Capital project management & budgeting
• NYC compliance (HPD, DHCR, Good Cause Eviction, LL97)

Our NYC Pro Concierge advisor is available for strategy calls, portfolio reviews, and ongoing advisory support.`,
  specialties: [
    'Luxury Rentals',
    'Co-op & Condo Management',
    'Commercial Properties',
    'Capital Project Management',
    'Financial Management & Budgeting',
    'Property Acquisition',
    'Board Reporting',
    'NYC Compliance',
    'Multi-Family Management',
    'Tenant Relations',
  ],
  languages: ['English'],
  yearsExperience: 10,
  photoUrl: '/advisors/nyc-pro-advisor.jpg',
  email: 'concierge@landlordbot.app',
  phone: '(212) 555-0199',
  availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  availableHours: {
    start: '09:00',
    end: '18:00',
  },
  maxCallsPerWeek: 15,
  currentWeeklyBookings: 6,
  isAvailable: true,
  tier: 'elite',
  rating: 4.9,
  reviewCount: 89,
  certifications: [
    'NYS Real Estate License',
    'Environmental Engineering Degree',
    'Luxury Rental Specialist',
    'Commercial Property Management',
    'Capital Projects Certified',
  ],
  verified: true,
};

// Additional advisor profiles for team page
export const ADDITIONAL_ADVISORS: AdvisorProfile[] = [
  {
    id: 'advisor_sarah_chen',
    name: 'Sarah Chen',
    title: 'Tax Strategist & CPA',
    credentials: [
      'Certified Public Accountant (CPA)',
      'Real Estate Tax Specialist',
      'IRS Enrolled Agent',
    ],
    bio: 'Sarah specializes in real estate tax optimization and Schedule E preparation. Available for Pro and Elite tier members.',
    specialties: ['Tax Optimization', 'Schedule E', '1031 Exchanges', 'Depreciation Strategy'],
    languages: ['English', 'Mandarin'],
    yearsExperience: 8,
    email: 'sarah@landlordbot.ai',
    availableDays: ['Tuesday', 'Thursday'],
    availableHours: { start: '10:00', end: '16:00' },
    maxCallsPerWeek: 10,
    currentWeeklyBookings: 4,
    isAvailable: true,
    tier: 'pro',
    rating: 4.8,
    reviewCount: 89,
    certifications: ['CPA', 'IRS Enrolled Agent', 'Real Estate Tax Specialist'],
    verified: true,
  },
  {
    id: 'advisor_marcus_williams',
    name: 'Marcus Williams',
    title: 'Construction & Renovation Expert',
    credentials: [
      'Licensed General Contractor (NYC)',
      'Certified Home Inspector',
      'LEED Green Associate',
    ],
    bio: 'Marcus has 15+ years in NYC construction helping landlords maximize renovation ROI. Elite tier available.',
    specialties: ['Renovation ROI', 'Contractor Management', 'Permits & DOB', 'Cost Estimation'],
    languages: ['English'],
    yearsExperience: 15,
    email: 'marcus@landlordbot.ai',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableHours: { start: '08:00', end: '17:00' },
    maxCallsPerWeek: 12,
    currentWeeklyBookings: 6,
    isAvailable: true,
    tier: 'elite',
    rating: 4.9,
    reviewCount: 156,
    certifications: ['NYC GC License', 'Home Inspector', 'LEED GA'],
    verified: true,
  },
];

export const ALL_ADVISORS = [GRENTEN_DHULI_PROFILE, ...ADDITIONAL_ADVISORS];

export class AdvisorService {
  private advisors: AdvisorProfile[] = ALL_ADVISORS;

  getAllAdvisors(): AdvisorProfile[] {
    return this.advisors;
  }

  getAdvisorById(id: string): AdvisorProfile | undefined {
    return this.advisors.find(a => a.id === id);
  }

  getEliteAdvisors(): AdvisorProfile[] {
    return this.advisors.filter(a => a.tier === 'elite');
  }

  getProAdvisors(): AdvisorProfile[] {
    return this.advisors.filter(a => a.tier === 'pro');
  }

  getAvailableAdvisors(): AdvisorProfile[] {
    return this.advisors.filter(a => a.isAvailable && a.currentWeeklyBookings < a.maxCallsPerWeek);
  }

  async bookSession(request: BookingRequest): Promise<BookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const advisor = this.getAdvisorById(request.advisorId);
    if (!advisor) {
      return { success: false, error: 'Advisor not found' };
    }

    if (!advisor.isAvailable) {
      return { success: false, error: 'Advisor not currently accepting bookings' };
    }

    if (advisor.currentWeeklyBookings >= advisor.maxCallsPerWeek) {
      return { 
        success: false, 
        error: `${advisor.name} is fully booked this week. Try ${advisor.name.split(' ')[0]} next week.`,
        alternatives: this.getAvailableAdvisors()
          .filter(a => a.id !== advisor.id)
          .slice(0, 3)
          .map(a => a.name),
      };
    }

    // Generate mock booking response
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const meetingLink = `https://meet.landlordbot.ai/${sessionId}`;

    return {
      success: true,
      sessionId,
      meetingLink,
      advisorName: advisor.name,
      scheduledAt: request.requestedTime,
      duration: request.duration,
    };
  }

  async cancelSession(sessionId: string): Promise<{ success: boolean; refundEligible: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    // Mock cancellation - in real implementation, check time until session
    return { success: true, refundEligible: true };
  }

  async rescheduleSession(
    sessionId: string, 
    newTime: string
  ): Promise<{ success: boolean; newSessionId?: string; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { 
      success: true, 
      newSessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  getAvailabilityWindow(advisorId: string, days: number = 14): Array<{ date: string; slots: string[] }> {
    const advisor = this.getAdvisorById(advisorId);
    if (!advisor) return [];

    const availability: Array<{ date: string; slots: string[] }> = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (advisor.availableDays.includes(dayName)) {
        availability.push({
          date: date.toISOString().split('T')[0],
          slots: this.generateTimeSlots(advisor.availableHours.start, advisor.availableHours.end),
        });
      }
    }
    
    return availability;
  }

  private generateTimeSlots(start: string, end: string): string[] {
    const slots: string[] = [];
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
  }
}

// Singleton instance
export const advisorService = new AdvisorService();
