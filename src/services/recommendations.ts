// Value-Add Recommendations Service
// AI-powered recommendations based on market data and property analytics

import type { ValueRecommendation } from '../types/pro';
import type { Unit } from '../types';

// Renovation cost database (average NYC contractor pricing)
export const RENOVATION_COSTS: Record<string, {
  costPerUnit: number;
  rentIncreasePerUnit: number;
  category: 'renovation' | 'amenity' | 'management' | 'operational';
  description: string;
}> = {
  kitchen_full: {
    costPerUnit: 8000,
    rentIncreasePerUnit: 350,
    category: 'renovation',
    description: 'Replace cabinets, countertops, and appliances. ROI typically 24-30 months.',
  },
  kitchen_partial: {
    costPerUnit: 3500,
    rentIncreasePerUnit: 150,
    category: 'renovation',
    description: 'Refinish cabinets, new hardware, fresh paint. ROI typically 24 months.',
  },
  bathroom_full: {
    costPerUnit: 6000,
    rentIncreasePerUnit: 300,
    category: 'renovation',
    description: 'Full bathroom renovation. ROI typically 20-24 months.',
  },
  bathroom_partial: {
    costPerUnit: 2500,
    rentIncreasePerUnit: 125,
    category: 'renovation',
    description: 'New fixtures, vanity, toilet. ROI typically 20 months.',
  },
  flooring: {
    costPerUnit: 3000,
    rentIncreasePerUnit: 100,
    category: 'renovation',
    description: 'New hardwood or LVP flooring. ROI typically 30 months.',
  },
  painting: {
    costPerUnit: 800,
    rentIncreasePerUnit: 50,
    category: 'renovation',
    description: 'Full interior paint refresh. ROI typically 16 months.',
  },
  washer_dryer: {
    costPerUnit: 2500,
    rentIncreasePerUnit: 150,
    category: 'amenity',
    description: 'In-unit washer/dryer hookups. MCI eligible. ROI typically 17 months.',
  },
  dishwasher: {
    costPerUnit: 600,
    rentIncreasePerUnit: 50,
    category: 'amenity',
    description: 'New dishwasher installation. ROI typically 12 months.',
  },
  ac_unit: {
    costPerUnit: 400,
    rentIncreasePerUnit: 25,
    category: 'amenity',
    description: 'Window AC unit. ROI typically 16 months.',
  },
  smart_thermostat: {
    costPerUnit: 400,
    rentIncreasePerUnit: 25,
    category: 'amenity',
    description: 'Nest/Ecobee smart thermostat. ROI typically 16 months.',
  },
  storage_lockers: {
    costPerUnit: 500,
    rentIncreasePerUnit: 35,
    category: 'amenity',
    description: 'Basement storage lockers. ROI typically 14 months.',
  },
  security_system: {
    costPerUnit: 300,
    rentIncreasePerUnit: 20,
    category: 'amenity',
    description: 'Doorbell camera, smart locks. ROI typically 15 months.',
  },
  led_lighting: {
    costPerUnit: 250,
    rentIncreasePerUnit: 15,
    category: 'operational',
    description: 'LED conversion - reduces utility costs. Self-funding in 18 months.',
  },
  water_efficient: {
    costPerUnit: 180,
    rentIncreasePerUnit: 10,
    category: 'operational',
    description: 'Low-flow fixtures - reduces water bills. Self-funding.',
  },
  landscaping: {
    costPerUnit: 1500,
    rentIncreasePerUnit: 75,
    category: 'operational',
    description: 'Professional landscaping. Improves curb appeal. ROI 20 months.',
  },
  exterior_paint: {
    costPerUnit: 5000,
    rentIncreasePerUnit: 75,
    category: 'operational',
    description: 'Fresh exterior paint. Consider every 5-7 years. ROI 67 months.',
  },
  smart_locks: {
    costPerUnit: 300,
    rentIncreasePerUnit: 20,
    category: 'management',
    description: 'Smart locks for self-showings. Reduces management time.',
  },
  online_portal: {
    costPerUnit: 15,
    rentIncreasePerUnit: 0,
    category: 'management',
    description: 'Tenant portal for payments. Efficiency gain, no rent increase.',
  },
};

// Vendor recommendations database
export const VENDOR_DATABASE: Record<string, {
  name: string;
  specialty: string;
  phone: string;
  rating: number;
  verified: boolean;
}> = {
  kitchen_1: {
    name: 'NYC Kitchen Pros',
    specialty: 'Kitchen Renovations',
    phone: '(718) 555-0123',
    rating: 4.8,
    verified: true,
  },
  kitchen_2: {
    name: 'BK Kitchen Solutions',
    specialty: 'Kitchen Renovations',
    phone: '(718) 555-0456',
    rating: 4.6,
    verified: true,
  },
  bathroom_1: {
    name: 'Manhattan Bath Co',
    specialty: 'Bathroom Renovations',
    phone: '(212) 555-0789',
    rating: 4.9,
    verified: true,
  },
  flooring_1: {
    name: 'Five Borough Flooring',
    specialty: 'Hardwood & LVP',
    phone: '(917) 555-0321',
    rating: 4.7,
    verified: true,
  },
  painting_1: {
    name: 'Brooklyn Painters',
    specialty: 'Interior/Exterior',
    phone: '(718) 555-0654',
    rating: 4.5,
    verified: false,
  },
  appliances_1: {
    name: 'NYC Appliance Install',
    specialty: 'Washer/Dryer/Dishwasher',
    phone: '(212) 555-0987',
    rating: 4.4,
    verified: true,
  },
  hvac_1: {
    name: 'Cool NYC HVAC',
    specialty: 'AC & Thermostats',
    phone: '(718) 555-0143',
    rating: 4.3,
    verified: false,
  },
  landscaping_1: {
    name: 'Green Thumb NYC',
    specialty: 'Landscaping',
    phone: '(347) 555-0276',
    rating: 4.6,
    verified: true,
  },
};

export interface PropertyAnalytics {
  avgRent: number;
  marketRent: number;
  vacancyRate: number;
  unitsBelowMarket: Unit[];
  unitsVacant: Unit[];
  avgTenantYears: number;
  maintenanceSpend: number;
  leaseRenewalsUpcoming: Unit[];
}

export class RecommendationsService {
  
  calculateROI(cost: number, monthlyIncrease: number): number {
    if (monthlyIncrease <= 0) return 0;
    return Math.ceil(cost / monthlyIncrease);
  }

  analyzeProperty(units: Unit[], payments: { unitId: string; amount: number }[] = []): PropertyAnalytics {
    const occupied = units.filter(u => u.status === 'occupied');
    const rents = occupied.map(u => u.rentAmount).filter(r => r > 0);
    const avgRent = rents.length > 0 ? rents.reduce((a, b) => a + b, 0) / rents.length : 0;
    
    // Estimate market rent as 10% higher (would come from real API)
    const marketRent = avgRent * 1.1;

    return {
      avgRent,
      marketRent,
      vacancyRate: (units.filter(u => u.status === 'vacant').length / units.length) * 100,
      unitsBelowMarket: units.filter(u => u.status === 'occupied' && u.rentAmount < marketRent * 0.95),
      unitsVacant: units.filter(u => u.status === 'vacant'),
      avgTenantYears: 1.5, // Would calculate from lease start dates
      maintenanceSpend: payments
        .filter(p => p.amount < 1000) // Assume maintenance is smaller amounts
        .reduce((sum, p) => sum + p.amount, 0),
      leaseRenewalsUpcoming: units.filter(u => {
        if (!u.tenant?.leaseEndDate) return false;
        const endDate = new Date(u.tenant.leaseEndDate);
        const daysUntil = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 90;
      }),
    };
  }

  generateRecommendations(
    propertyId: string,
    units: Unit[],
    payments: { unitId: string; amount: number }[] = []
  ): ValueRecommendation[] {
    const analytics = this.analyzeProperty(units, payments);
    const recommendations: ValueRecommendation[] = [];

    // 1. Rent increase recommendations for units below market
    analytics.unitsBelowMarket.forEach((unit, idx) => {
      const potentialIncrease = Math.round(analytics.marketRent - unit.rentAmount);
      if (potentialIncrease > 50) {
        recommendations.push({
          id: `rec_rent_${unit.id}`,
          propertyId,
          category: 'operational',
          priority: potentialIncrease > 200 ? 'high' : 'medium',
          title: `Rent Increase Opportunity - Unit ${unit.unitNumber}`,
          description: `Unit ${unit.unitNumber} is renting $${potentialIncrease}/month below market. Consider a 3-5% increase at renewal or a larger adjustment if tenant has been there 2+ years.`,
          costEstimate: 0,
          monthlyRentIncrease: potentialIncrease,
          roiMonths: 0,
          annualRevenueImpact: potentialIncrease * 12,
          status: 'suggested',
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 2. Vacant unit improvements
    analytics.unitsVacant.forEach((unit) => {
      recommendations.push({
        id: `rec_vacant_kitchen_${unit.id}`,
        propertyId,
        category: 'renovation',
        priority: 'high',
        title: `Kitchen Upgrade - Vacant Unit ${unit.unitNumber}`,
        description: `While Unit ${unit.unitNumber} is vacant, consider a kitchen renovation before re-listing. Similar units in the area command $300-400 more per month after kitchen upgrades.`,
        costEstimate: RENOVATION_COSTS.kitchen_full.costPerUnit,
        monthlyRentIncrease: RENOVATION_COSTS.kitchen_full.rentIncreasePerUnit,
        roiMonths: this.calculateROI(
          RENOVATION_COSTS.kitchen_full.costPerUnit,
          RENOVATION_COSTS.kitchen_full.rentIncreasePerUnit
        ),
        annualRevenueImpact: RENOVATION_COSTS.kitchen_full.rentIncreasePerUnit * 12,
        vendorId: 'kitchen_1',
        vendorName: VENDOR_DATABASE.kitchen_1.name,
        vendorPhone: VENDOR_DATABASE.kitchen_1.phone,
        status: 'suggested',
        createdAt: new Date().toISOString(),
      });

      recommendations.push({
        id: `rec_vacant_washer_${unit.id}`,
        propertyId,
        category: 'amenity',
        priority: 'medium',
        title: `Add Washer/Dryer - Unit ${unit.unitNumber}`,
        description: `Install washer/dryer hookups during vacancy. This qualifies for Major Capital Improvement (MCI) rent increases and significantly improves tenant retention.`,
        costEstimate: RENOVATION_COSTS.washer_dryer.costPerUnit,
        monthlyRentIncrease: RENOVATION_COSTS.washer_dryer.rentIncreasePerUnit,
        roiMonths: this.calculateROI(
          RENOVATION_COSTS.washer_dryer.costPerUnit,
          RENOVATION_COSTS.washer_dryer.rentIncreasePerUnit
        ),
        annualRevenueImpact: RENOVATION_COSTS.washer_dryer.rentIncreasePerUnit * 12,
        vendorId: 'appliances_1',
        vendorName: VENDOR_DATABASE.appliances_1.name,
        vendorPhone: VENDOR_DATABASE.appliances_1.phone,
        status: 'considering',
        createdAt: new Date().toISOString(),
      });
    });

    // 3. Occupied unit upgrades (lower priority)
    occupiedUnits.length > 0 && recommendations.push({
      id: `rec_occupied_thermostat`,
      propertyId,
      category: 'amenity',
      priority: 'low',
      title: 'Smart Thermostat Installation',
      description: 'Install Nest or Ecobee thermostats in all units. Tenants appreciate the modern amenity and you get energy usage data for better utility management.',
      costEstimate: RENOVATION_COSTS.smart_thermostat.costPerUnit * units.length,
      monthlyRentIncrease: RENOVATION_COSTS.smart_thermostat.rentIncreasePerUnit * units.length,
      roiMonths: this.calculateROI(
        RENOVATION_COSTS.smart_thermostat.costPerUnit * units.length,
        RENOVATION_COSTS.smart_thermostat.rentIncreasePerUnit * units.length
      ),
      annualRevenueImpact: RENOVATION_COSTS.smart_thermostat.rentIncreasePerUnit * 12 * units.length,
      vendorId: 'hvac_1',
      vendorName: VENDOR_DATABASE.hvac_1.name,
      vendorPhone: VENDOR_DATABASE.hvac_1.phone,
      status: 'suggested',
      createdAt: new Date().toISOString(),
    });

    // 4. Operational improvements
    recommendations.push({
      id: `rec_operational_led`,
      propertyId,
      category: 'operational',
      priority: 'low',
      title: 'LED Lighting Conversion',
      description: 'Convert all common area lighting to LED. Reduces utility costs and provides immediate savings. Self-funding within 18 months.',
      costEstimate: RENOVATION_COSTS.led_lighting.costPerUnit * units.length,
      monthlyRentIncrease: 0,
      roiMonths: 0,
      annualRevenueImpact: 300 * units.length, // Estimated savings
      status: 'suggested',
      createdAt: new Date().toISOString(),
    });

    // 5. Exterior improvements (periodic)
    recommendations.push({
      id: `rec_exterior_paint`,
      propertyId,
      category: 'operational',
      priority: 'low',
      title: 'Exterior Paint Refresh',
      description: 'Fresh exterior paint increases curb appeal and can justify higher rents. Consider every 5-7 years. Current paint is likely 3+ years old.',
      costEstimate: RENOVATION_COSTS.exterior_paint.costPerUnit,
      monthlyRentIncrease: RENOVATION_COSTS.exterior_paint.rentIncreasePerUnit,
      roiMonths: this.calculateROI(
        RENOVATION_COSTS.exterior_paint.costPerUnit,
        RENOVATION_COSTS.exterior_paint.rentIncreasePerUnit
      ),
      annualRevenueImpact: RENOVATION_COSTS.exterior_paint.rentIncreasePerUnit * 12,
      status: 'suggested',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    });

    return recommendations.sort((a, b) => {
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getAvailableVendors(category?: string): typeof VENDOR_DATABASE {
    if (!category) return VENDOR_DATABASE;
    
    return Object.entries(VENDOR_DATABASE)
      .filter(([key, vendor]) => {
        if (category === 'renovation') {
          return key.includes('kitchen') || key.includes('bathroom') || key.includes('flooring');
        }
        if (category === 'amenity') {
          return key.includes('appliances') || key.includes('hvac');
        }
        if (category === 'operational') {
          return key.includes('landscaping') || key.includes('painting');
        }
        return true;
      })
      .reduce((acc, [key, vendor]) => {
        acc[key] = vendor;
        return acc;
      }, {} as typeof VENDOR_DATABASE);
  }

  getVendorById(vendorId: string) {
    return VENDOR_DATABASE[vendorId] || null;
  }

  getRenovationCost(key: string) {
    return RENOVATION_COSTS[key] || null;
  }
}

const occupiedUnits: Unit[] = []; // Placeholder for occupied units

// Singleton instance
export const recommendationsService = new RecommendationsService();
