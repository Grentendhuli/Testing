// CPA Financial Report Generation Service
// Generates tax-ready reports and Schedule E exports

import type { FinancialReport, UnitPerformance } from '../types/pro';
import type { Unit, Payment } from '../types';

export interface ReportGenerationRequest {
  year: number;
  month: number;
  propertyAddress: string;
  units: Unit[];
  payments: Payment[];
  expenses?: ExpenseItem[];
  mortgageInterest?: number;
}

export interface ExpenseItem {
  category: 'maintenance' | 'utilities' | 'insurance' | 'propertyTax' | 'managementFees' | 'legal' | 'other';
  description: string;
  amount: number;
  date: string;
  unitId?: string;
}

export interface ScheduleEData {
  address: string;
  rentalIncome: number;
  expenses: {
    advertising: number;
    autoTravel: number;
    cleaningMaintenance: number;
    commissions: number;
    insurance: number;
    legalProfessional: number;
    managementFees: number;
    mortgageInterest: number;
    otherInterest: number;
    repairs: number;
    supplies: number;
    taxes: number;
    utilities: number;
    depreciation: number;
    otherExpenses: number;
  };
  totalExpenses: number;
  netRentalIncome: number;
}

export class ReportService {
  private readonly DEPRECIATION_YEARS = 27.5; // Residential rental property
  private propertyBasis: number = 500000; // Default property value

  setPropertyBasis(basis: number): void {
    this.propertyBasis = basis;
  }

  calculateMonthlyDepreciation(): number {
    return this.propertyBasis / (this.DEPRECIATION_YEARS * 12);
  }

  calculateCapRate(noi: number, propertyValue: number): number {
    return propertyValue > 0 ? (noi / propertyValue) * 100 : 0;
  }

  calculateCashOnCash(annualCashFlow: number, cashInvested: number): number {
    return cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;
  }

  calculateGrossRentMultiplier(annualRent: number, propertyValue: number): number {
    return annualRent > 0 ? propertyValue / annualRent : 0;
  }

  generateFinancialReport(request: ReportGenerationRequest): FinancialReport {
    const { year, month, propertyAddress, units, payments, expenses = [] } = request;
    
    // Calculate rental income from actual payments
    const monthlyPayments = payments.filter(p => {
      const pDate = p.paymentDate ? new Date(p.paymentDate) : new Date();
      return p.status === 'paid' && 
             pDate.getFullYear() === year && 
             pDate.getMonth() === month - 1;
    });

    const rentalIncome = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Categorize expenses
    const maintenance = expenses
      .filter(e => e.category === 'maintenance')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const utilities = expenses
      .filter(e => e.category === 'utilities')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const insurance = expenses
      .filter(e => e.category === 'insurance')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const propertyTax = expenses
      .filter(e => e.category === 'propertyTax')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const managementFees = expenses
      .filter(e => e.category === 'managementFees')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const legal = expenses
      .filter(e => e.category === 'legal')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const otherExpenses = expenses
      .filter(e => e.category === 'other')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = maintenance + utilities + insurance + propertyTax + managementFees + legal + otherExpenses;

    // Calculate depreciation (monthly)
    const depreciation = this.calculateMonthlyDepreciation();

    // Get mortgage interest from request or estimate
    const mortgageInterest = request.mortgageInterest || (rentalIncome * 0.25);

    // Calculate metrics
    const totalIncome = rentalIncome;
    const netOperatingIncome = totalIncome - totalExpenses;
    const taxableIncome = netOperatingIncome - depreciation - mortgageInterest;

    // Calculate per-unit performance
    const unitPerformance: UnitPerformance[] = units.map(unit => {
      const unitPayments = monthlyPayments.filter(p => p.unitId === unit.id);
      const unitRent = unitPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const unitExpenses = expenses
        .filter(e => e.unitId === unit.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        tenantName: unit.tenant?.name || 'Vacant',
        rent: unitRent,
        daysVacant: unit.status === 'vacant' ? 30 : 0,
        maintenanceCosts: unitExpenses,
        netIncome: unitRent - unitExpenses,
      };
    });

    // Calculate performance metrics
    const annualRent = rentalIncome * 12;
    const propertyValue = this.propertyBasis;
    const annualNOI = netOperatingIncome * 12;
    const capRate = this.calculateCapRate(annualNOI, propertyValue);
    
    // Estimate cash invested (20% down payment as default)
    const cashInvested = propertyValue * 0.2;
    const annualCashFlow = (netOperatingIncome - mortgageInterest) * 12;
    const cashOnCashReturn = this.calculateCashOnCash(annualCashFlow, cashInvested);
    const grossRentMultiplier = this.calculateGrossRentMultiplier(annualRent, propertyValue);

    return {
      id: `report_${year}_${month.toString().padStart(2, '0')}`,
      year,
      month,
      generatedAt: new Date().toISOString(),
      status: 'draft',
      propertyAddress: propertyAddress || 'Investment Property',
      rentalIncome,
      otherIncome: 0,
      totalIncome,
      maintenance,
      utilities,
      insurance,
      propertyTax,
      managementFees,
      legal,
      otherExpenses,
      totalExpenses,
      netOperatingIncome,
      depreciation,
      mortgageInterest,
      taxableIncome,
      capRate,
      cashOnCashReturn,
      grossRentMultiplier,
      unitPerformance,
    };
  }

  generateScheduleE(report: FinancialReport): ScheduleEData {
    return {
      address: report.propertyAddress || '',
      rentalIncome: report.rentalIncome,
      expenses: {
        advertising: 0,
        autoTravel: 0,
        cleaningMaintenance: report.maintenance,
        commissions: 0,
        insurance: report.insurance,
        legalProfessional: report.legal,
        managementFees: report.managementFees,
        mortgageInterest: report.mortgageInterest,
        otherInterest: 0,
        repairs: report.maintenance * 0.7, // Estimate
        supplies: 0,
        taxes: report.propertyTax,
        utilities: report.utilities,
        depreciation: report.depreciation,
        otherExpenses: report.otherExpenses,
      },
      totalExpenses: report.totalExpenses + report.depreciation,
      netRentalIncome: report.taxableIncome,
    };
  }

  generatePDFContent(report: FinancialReport): string {
    const monthName = new Date(report.year, report.month - 1).toLocaleString('en-US', { month: 'long' });
    
    return `
REAL ESTATE INVESTMENT REPORT
=============================

Property: ${report.propertyAddress || 'Investment Property'}
Period: ${monthName} ${report.year}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}
Status: ${report.status.toUpperCase()}

INCOME SUMMARY
--------------
Rental Income:              $${report.rentalIncome.toLocaleString()}
Other Income:             $${report.otherIncome.toLocaleString()}
                          ----------------
Total Income:             $${report.totalIncome.toLocaleString()}

EXPENSES
--------
Maintenance:              $${report.maintenance.toLocaleString()}
Utilities:                $${report.utilities.toLocaleString()}
Insurance:                $${report.insurance.toLocaleString()}
Property Tax:             $${report.propertyTax.toLocaleString()}
Management Fees:          $${report.managementFees.toLocaleString()}
Legal/Professional:       $${report.legal.toLocaleString()}
Other Expenses:           $${report.otherExpenses.toLocaleString()}
                          ----------------
Total Expenses:           $${report.totalExpenses.toLocaleString()}

PERFORMANCE METRICS
-------------------
Net Operating Income:     $${report.netOperatingIncome.toLocaleString()}
Depreciation:             $${Math.round(report.depreciation).toLocaleString()}
Mortgage Interest:        $${report.mortgageInterest.toLocaleString()}
Taxable Income:           $${report.taxableIncome.toLocaleString()}

Capitalization Rate:      ${report.capRate.toFixed(2)}%
Cash-on-Cash Return:      ${report.cashOnCashReturn.toFixed(2)}%
Gross Rent Multiplier:    ${report.grossRentMultiplier.toFixed(2)}

UNIT PERFORMANCE
----------------
${report.unitPerformance.map(u => `
Unit ${u.unitNumber}: ${u.tenantName}
  Rent: $${u.rent.toLocaleString()} | Days Vacant: ${u.daysVacant}
  Maintenance: $${u.maintenanceCosts.toLocaleString()} | Net: $${u.netIncome.toLocaleString()}
`).join('\n')}

---
This report was generated by LandlordBot Pro
Not for tax filing without CPA review
`;
  }

  downloadPDF(report: FinancialReport, filename?: string): void {
    const content = this.generatePDFContent(report);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `financial-report-${report.year}-${report.month}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadScheduleE(report: FinancialReport): void {
    const scheduleE = this.generateScheduleE(report);
    
    const content = `SCHEDULE E (FORM 1040) DATA
============================

Property Address: ${scheduleE.address}

Rental Income: $${scheduleE.rentalIncome.toLocaleString()}

EXPENSES:
---------
Advertising:              $${scheduleE.expenses.advertising.toLocaleString()}
Auto and Travel:          $${scheduleE.expenses.autoTravel.toLocaleString()}
Cleaning and Maintenance: $${scheduleE.expenses.cleaningMaintenance.toLocaleString()}
Commissions:              $${scheduleE.expenses.commissions.toLocaleString()}
Insurance:                $${scheduleE.expenses.insurance.toLocaleString()}
Legal and Professional:   $${scheduleE.expenses.legalProfessional.toLocaleString()}
Management Fees:          $${scheduleE.expenses.managementFees.toLocaleString()}
Mortgage Interest:        $${scheduleE.expenses.mortgageInterest.toLocaleString()}
Other Interest:           $${scheduleE.expenses.otherInterest.toLocaleString()}
Repairs:                  $${scheduleE.expenses.repairs.toLocaleString()}
Supplies:                 $${scheduleE.expenses.supplies.toLocaleString()}
Taxes:                    $${scheduleE.expenses.taxes.toLocaleString()}
Utilities:                $${scheduleE.expenses.utilities.toLocaleString()}
Depreciation:             $${scheduleE.expenses.depreciation.toLocaleString()}
Other Expenses:           $${scheduleE.expenses.otherExpenses.toLocaleString()}

TOTAL EXPENSES:           $${scheduleE.totalExpenses.toLocaleString()}
NET RENTAL INCOME:        $${scheduleE.netRentalIncome.toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const filename = `schedule-e-${report.year}-${report.month}.txt`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const reportService = new ReportService();
