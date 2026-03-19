// PDF generation for CPA financial reports
import { FinancialReport } from '../types/pro';

// Generate Schedule E worksheet as HTML for PDF export
export async function generateScheduleE(
  report: FinancialReport,
  propertyAddress: string,
  ownerName: string,
  taxYear: number
): Promise<Blob> {
  const currency = (n: number) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Schedule E - ${propertyAddress}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; margin: 40px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .title { font-size: 18pt; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14pt; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .number { text-align: right; font-family: monospace; }
    .total { font-weight: bold; border-top: 2px solid #333; }
    .cert-box { border: 2px solid #4CAF50; padding: 15px; margin-top: 20px; background: #f1f8e9; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Schedule E - Supplemental Income and Loss</div>
    <div>Tax Year ${taxYear} | ${new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
  </div>
  
  <table>
    <tr><td><strong>Property:</strong></td><td>${propertyAddress}</td><td><strong>Owner:</strong></td><td>${ownerName}</td></tr>
  </table>
  
  <div class="section">
    <div class="section-title">Income</div>
    <table>
      <tr><td>Rents received</td><td class="number">${currency(report.rentalIncome)}</td></tr>
      <tr><td>Other income</td><td class="number">${currency(report.otherIncome)}</td></tr>
      <tr class="total"><td>Total Income</td><td class="number">${currency(report.totalIncome)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Expenses</div>
    <table>
      <tr><td>Maintenance</td><td class="number">${currency(report.maintenance)}</td></tr>
      <tr><td>Insurance</td><td class="number">${currency(report.insurance)}</td></tr>
      <tr><td>Legal/professional fees</td><td class="number">${currency(report.legal)}</td></tr>
      <tr><td>Management fees</td><td class="number">${currency(report.managementFees)}</td></tr>
      <tr><td>Mortgage interest</td><td class="number">${currency(report.mortgageInterest)}</td></tr>
      <tr><td>Property taxes</td><td class="number">${currency(report.propertyTax)}</td></tr>
      <tr><td>Utilities</td><td class="number">${currency(report.utilities)}</td></tr>
      <tr><td>Other expenses</td><td class="number">${currency(report.otherExpenses)}</td></tr>
      <tr class="total"><td>Total Expenses</td><td class="number">${currency(report.totalExpenses)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Net Income/Loss</div>
    <table>
      <tr><td>Income</td><td class="number">${currency(report.totalIncome)}</td></tr>
      <tr><td>Less: Expenses</td><td class="number">(${currency(report.totalExpenses)})</td></tr>
      <tr><td>Less: Depreciation</td><td class="number">(${currency(report.depreciation)})</td></tr>
      <tr class="total"><td>Taxable Income/Loss</td><td class="number">${currency(report.taxableIncome)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Performance Metrics</div>
    <p>Cap Rate: ${report.capRate.toFixed(1)}%</p>
    <p>Cash-on-Cash Return: ${report.cashOnCashReturn.toFixed(1)}%</p>
    <p>Gross Rent Multiplier: ${report.grossRentMultiplier.toFixed(1)}x</p>
    <p>Net Operating Income: ${currency(report.netOperatingIncome)}</p>
  </div>
  
  ${report.status === 'certified' ? `
  <div class="cert-box">
    <strong>CPA Certified</strong><br>
    Certified by: ${report.certifiedBy || 'N/A'}<br>
    Date: ${report.certificationDate ? new Date(report.certificationDate).toLocaleDateString() : 'N/A'}
  </div>
  ` : ''}
</body>
</html>`;
  
  return new Blob([html], { type: 'text/html' });
}

// Generate CSV for accounting software import
export function generateAccountingExport(report: FinancialReport): Blob {
  const headers = ['Date', 'Category', 'Description', 'Amount'];
  const rows: (string | number)[][] = [];
  const date = `${report.year}-${String(report.month).padStart(2, '0')}-01`;
  
  // Income
  report.unitPerformance.forEach(unit => {
    rows.push([date, 'Rental Income', `Rent Unit ${unit.unitNumber}`, unit.rent]);
  });
  
  // Expenses
  if (report.maintenance > 0) rows.push([date, 'Maintenance', 'Maintenance', report.maintenance]);
  if (report.utilities > 0) rows.push([date, 'Utilities', 'Utilities', report.utilities]);
  if (report.insurance > 0) rows.push([date, 'Insurance', 'Insurance', report.insurance]);
  if (report.propertyTax > 0) rows.push([date, 'Taxes', 'Property Taxes', report.propertyTax]);
  
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

// Download helper
export function downloadReport(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
