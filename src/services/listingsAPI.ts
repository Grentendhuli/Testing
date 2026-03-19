// Live Listings API Integrations
// Supports Reddit, Facebook Marketplace, StreetEasy, and Apartments.com

export type ListingPlatform = 'reddit' | 'facebook' | 'streeteasy' | 'apartments' | 'craigslist';

export interface ListingSource {
  id: ListingPlatform;
  name: string;
  displayName: string;
  description: string;
  isPaid: boolean;
  monthlyCost?: number;
  setupCost?: number;
  features: string[];
  nycMarketplace: boolean;
  logoUrl?: string;
  website: string;
  connected: boolean;
  connectedAt?: string;
  apiStatus: 'available' | 'beta' | 'coming_soon' | 'paid_only';
  requiresPhoneNumber: boolean;
  botPhoneInstructions?: string;
}

export interface IncomingLead {
  id: string;
  source: ListingPlatform;
  sourceName: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  inquiryText: string;
  propertyAddress?: string;
  bedrooms?: number;
  bathrooms?: number;
  budget?: number;
  moveInDate?: string;
  moveInPreference?: string;
  receivedAt: string;
  status: 'new' | 'contacted' | 'qualified' | 'showing_scheduled' | 'converted' | 'declined';
  botResponded: boolean;
  botResponseText?: string;
  threadUrl?: string;
  postId?: string;
  neighborhood?: string;
}

export interface ListingConnectionConfig {
  platform: ListingPlatform;
  enabled: boolean;
  botPhoneNumber: string;
  autoReply: boolean;
  autoReplyTemplate?: string;
  replyDelayMinutes: number;
  qualifyBeforeShowing: boolean;
  sendPricingInfo: boolean;
  sendAvailabilityInfo: boolean;
  keywords?: string[];
}

export interface ListingPost {
  id: string;
  platform: ListingPlatform;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  address: string;
  neighborhood: string;
  photos: string[];
  status: 'draft' | 'live' | 'paused' | 'expired';
  postedAt?: string;
  expiresAt?: string;
  views: number;
  inquiries: number;
  url?: string;
  useBotPhone: boolean;
  botPhoneNumber?: string;
}

// Platform configurations
export const LISTING_PLATFORMS: ListingSource[] = [
  {
    id: 'reddit',
    name: 'reddit',
    displayName: 'Reddit NYC Apartments',
    description: 'Post to r/NYCapartments and related subreddits. Great for reaching young professionals.',
    isPaid: false,
    features: [
      'Free listing creation',
      'Reach Reddit\'s large NYC community',
      'Direct messages to your bot',
      'Comment tracking',
      'Weekly bump reminders',
    ],
    nycMarketplace: true,
    website: 'https://reddit.com/r/NYCapartments',
    connected: false,
    apiStatus: 'available',
    requiresPhoneNumber: true,
    botPhoneInstructions: 'Set your LandlordBot phone number in your post and ask renters to text it with "[ADDRESS]" to schedule a showing.',
  },
  {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook Marketplace',
    description: 'List on Facebook Marketplace. Largest reach for NYC area.',
    isPaid: false,
    features: [
      'Free listing (with phone number as contact)',
      'Massive NYC user base',
      'Message forwarding to your bot',
      'Integration with FB Messenger',
      'Boost options available',
    ],
    nycMarketplace: true,
    website: 'https://facebook.com/marketplace',
    connected: false,
    apiStatus: 'beta',
    requiresPhoneNumber: true,
    botPhoneInstructions: 'Create a listing on Facebook Marketplace and use [BOT_PHONE] as your contact phone number. Messages will come to your bot.',
  },
  {
    id: 'craigslist',
    name: 'craigslist',
    displayName: 'Craigslist',
    description: 'Free NYC listings on Craigslist. Traditional go-to for renters.',
    isPaid: false,
    features: [
      'Free apartment listings in NYC',
      'High renter engagement',
      'Email forwarding to bot',
      'Renewal reminders',
      'Cross-posting support',
    ],
    nycMarketplace: true,
    website: 'https://newyork.craigslist.org',
    connected: false,
    apiStatus: 'available',
    requiresPhoneNumber: true,
    botPhoneInstructions: 'Include [BOT_PHONE] in your Craigslist post. The bot will screen inquiries sent to that number.',
  },
  {
    id: 'streeteasy',
    name: 'streeteasy',
    displayName: 'StreetEasy',
    description: 'NYC\'s #1 rental platform. Premium placement for maximum exposure.',
    isPaid: true,
    monthlyCost: 175,
    setupCost: 495,
    features: [
      'Featured placement on NYC\'s top rental site',
      'Professional listing page',
      'Verified listing badge',
      'Analytics dashboard',
      'API integration with bot',
      'Tenant screening tools',
      'Virtual tour hosting',
    ],
    nycMarketplace: true,
    website: 'https://streeteasy.com',
    connected: false,
    apiStatus: 'paid_only',
    requiresPhoneNumber: true,
    botPhoneInstructions: 'StreetEasy supports phone-based lead routing. Set your bot phone number in your account preferences to auto-forward inquiries.',
  },
  {
    id: 'apartments',
    name: 'apartments',
    displayName: 'Apartments.com',
    description: 'Nationwide rental platform with strong NYC presence.',
    isPaid: true,
    monthlyCost: 299,
    features: [
      'Premium placement on Apartments.com',
      'Network includes 8+ rental sites',
      'Lead qualification API',
      'Virtual tours',
      'Rent collection integration',
      'Tenant screening',
    ],
    nycMarketplace: true,
    website: 'https://apartments.com',
    connected: false,
    apiStatus: 'paid_only',
    requiresPhoneNumber: true,
    botPhoneInstructions: 'Connect your bot phone number to your Apartments.com advertiser account for automatic lead forwarding.',
  },
];

// Mock leads data generator
function generateMockLeads(platform: ListingPlatform, count: number = 5): IncomingLead[] {
  const names = ['Alex M.', 'Jordan K.', 'Taylor S.', 'Morgan R.', 'Casey L.', 'Jamie P.', 'Riley W.', 'Dakota N.'];
  const neighborhoods = ['Williamsburg', 'Park Slope', 'Greenpoint', 'Astoria', 'Upper East Side', 'Chelsea', 'West Village', 'Bushwick'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `lead_${platform}_${Date.now()}_${i}`,
    source: platform,
    sourceName: LISTING_PLATFORMS.find(p => p.id === platform)?.displayName || platform,
    tenantName: names[i % names.length],
    tenantPhone: Math.random() > 0.3 ? `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
    tenantEmail: Math.random() > 0.5 ? `inquiry${i}@email.com` : undefined,
    inquiryText: [
      'Hi! Is this still available? I\'m looking to move in next month.',
      'Interested in viewing this apartment. What\'s the application process?',
      'Does this allow pets? I have a small dog. Available for a showing?',
      'What\'s the earliest move-in date? I can provide references.',
      'Can I schedule a tour for this weekend? My budget matches asking.',
    ][i % 5],
    neighborhood: neighborhoods[i % neighborhoods.length],
    bedrooms: [1, 2, 2, 1, 3][i % 5],
    bathrooms: [1, 1, 2, 1, 2][i % 5],
    budget: 2500 + Math.floor(Math.random() * 2000),
    moveInPreference: ['ASAP', 'Next month', 'In 2 weeks', 'End of month'][i % 4],
    receivedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    status: ['new', 'new', 'contacted', 'qualified'][i % 4] as IncomingLead['status'],
    botResponded: Math.random() > 0.5,
    botResponseText: Math.random() > 0.5 ? 'Yes, it\'s available! Text SHOW to schedule a tour.' : undefined,
    threadUrl: platform === 'reddit' ? `https://reddit.com/r/NYCapartments/comments/abc${i}` : undefined,
    postId: `post_${i}`,
  }));
}

export class ListingsAPIService {
  private connectedPlatforms: Set<ListingPlatform> = new Set();
  private botPhoneNumber: string = '';
  private configurations: Map<ListingPlatform, ListingConnectionConfig> = new Map();

  constructor() {
    // Load saved configurations from localStorage if available
    this.loadConfigurations();
  }

  private loadConfigurations(): void {
    try {
      const saved = localStorage.getItem('landlord_listings_config');
      if (saved) {
        const configs = JSON.parse(saved);
        Object.entries(configs).forEach(([platform, config]) => {
          this.configurations.set(platform as ListingPlatform, config as ListingConnectionConfig);
          if ((config as ListingConnectionConfig).enabled) {
            this.connectedPlatforms.add(platform as ListingPlatform);
          }
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  private saveConfigurations(): void {
    const configs: Record<string, ListingConnectionConfig> = {};
    this.configurations.forEach((config, platform) => {
      configs[platform] = config;
    });
    localStorage.setItem('landlord_listings_config', JSON.stringify(configs));
  }

  getPlatforms(): ListingSource[] {
    return LISTING_PLATFORMS.map(platform => ({
      ...platform,
      connected: this.connectedPlatforms.has(platform.id),
    }));
  }

  getFreePlatforms(): ListingSource[] {
    return this.getPlatforms().filter(p => !p.isPaid);
  }

  getPaidPlatforms(): ListingSource[] {
    return this.getPlatforms().filter(p => p.isPaid);
  }

  async connectPlatform(platform: ListingPlatform, config: Partial<ListingConnectionConfig>): Promise<{ 
    success: boolean; 
    message: string;
    error?: string;
    instructions?: string;
  }> {
    // Simulate API connection delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const fullConfig: ListingConnectionConfig = {
      platform,
      enabled: true,
      botPhoneNumber: config.botPhoneNumber || this.botPhoneNumber,
      autoReply: config.autoReply ?? true,
      autoReplyTemplate: config.autoReplyTemplate || 'Hi! Thanks for your interest. Text SHOW to schedule a tour of [ADDRESS] or REPLY for more info.',
      replyDelayMinutes: config.replyDelayMinutes ?? 5,
      qualifyBeforeShowing: config.qualifyBeforeShowing ?? true,
      sendPricingInfo: config.sendPricingInfo ?? true,
      sendAvailabilityInfo: config.sendAvailabilityInfo ?? true,
      ...config,
    };

    this.configurations.set(platform, fullConfig);
    this.connectedPlatforms.add(platform);
    this.saveConfigurations();

    const platformInfo = LISTING_PLATFORMS.find(p => p.id === platform);

    return {
      success: true,
      message: `${platformInfo?.displayName} connected successfully!`,
      instructions: platformInfo?.botPhoneInstructions?.replace('[BOT_PHONE]', fullConfig.botPhoneNumber),
    };
  }

  async disconnectPlatform(platform: ListingPlatform): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.connectedPlatforms.delete(platform);
    const config = this.configurations.get(platform);
    if (config) {
      config.enabled = false;
      this.configurations.set(platform, config);
    }
    this.saveConfigurations();

    return {
      success: true,
      message: `${LISTING_PLATFORMS.find(p => p.id === platform)?.displayName} disconnected.`,
    };
  }

  getConfiguration(platform: ListingPlatform): ListingConnectionConfig | undefined {
    return this.configurations.get(platform);
  }

  async updateConfiguration(platform: ListingPlatform, updates: Partial<ListingConnectionConfig>): Promise<void> {
    const existing = this.configurations.get(platform);
    if (existing) {
      this.configurations.set(platform, { ...existing, ...updates });
      this.saveConfigurations();
    }
  }

  async getIncomingLeads(filters?: { 
    platform?: ListingPlatform; 
    status?: IncomingLead['status'];
    daysBack?: number;
  }): Promise<IncomingLead[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    let leads: IncomingLead[] = [];

    // Generate mock leads for connected platforms
    this.connectedPlatforms.forEach(platform => {
      leads = leads.concat(generateMockLeads(platform, 3 + Math.floor(Math.random() * 5)));
    });

    // Apply filters
    if (filters?.platform) {
      leads = leads.filter(l => l.source === filters.platform);
    }
    if (filters?.status) {
      leads = leads.filter(l => l.status === filters.status);
    }
    if (filters?.daysBack) {
      const cutoff = Date.now() - filters.daysBack * 24 * 60 * 60 * 1000;
      leads = leads.filter(l => new Date(l.receivedAt).getTime() > cutoff);
    }

    return leads.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  async getLeadStats(): Promise<{
    totalLeads: number;
    newLeads: number;
    byPlatform: Record<string, number>;
    conversionRate: number;
  }> {
    const leads = await this.getIncomingLeads({ daysBack: 30 });
    
    const byPlatform: Record<string, number> = {};
    leads.forEach(lead => {
      byPlatform[lead.sourceName] = (byPlatform[lead.sourceName] || 0) + 1;
    });

    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      byPlatform,
      conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0,
    };
  }

  async updateLeadStatus(leadId: string, status: IncomingLead['status']): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // In real implementation, update database
  }

  setBotPhoneNumber(phone: string): void {
    this.botPhoneNumber = phone;
    // Update all configurations with new bot phone
    this.configurations.forEach((config, platform) => {
      config.botPhoneNumber = phone;
      this.configurations.set(platform, config);
    });
    this.saveConfigurations();
  }

  getBotPhoneNumber(): string {
    return this.botPhoneNumber;
  }

  async createListing(platform: ListingPlatform, listing: Partial<ListingPost>): Promise<{ 
    success: boolean; 
    postUrl?: string;
    postId?: string;
    error?: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (!this.connectedPlatforms.has(platform)) {
      return { 
        success: false, 
        error: `Please connect ${LISTING_PLATFORMS.find(p => p.id === platform)?.displayName} first.` 
      };
    }

    // Simulate successful posting
    return {
      success: true,
      postId: `lst_${Date.now()}`,
      postUrl: LISTING_PLATFORMS.find(p => p.id === platform)?.website,
    };
  }

  formatPhoneInstructions(template: string, botPhone: string, address?: string): string {
    return template
      .replace('[BOT_PHONE]', botPhone)
      .replace('[ADDRESS]', address || 'the property');
  }
}

// Singleton instance
export const listingsAPIService = new ListingsAPIService();

export default listingsAPIService;
