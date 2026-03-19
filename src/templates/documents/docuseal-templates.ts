/**
 * DocuSeal Document Templates
 * HTML templates for digital document signing
 * 
 * These templates are used with DocuSeal to create fillable PDF forms
 * for lease agreements, renewals, and notices.
 */

import type { TemplateField } from '../../services/docuseal';

// Standard Residential Lease Template
export const standardLeaseTemplate = {
  name: 'Standard Residential Lease Agreement',
  description: 'Standard one-year residential lease agreement',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Residential Lease Agreement</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #1a1a1a; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .section { margin-bottom: 20px; }
    .field { background-color: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-weight: bold; }
    .signature-block { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature-line { width: 250px; border-bottom: 1px solid #333; margin-top: 60px; }
    .date-line { width: 150px; border-bottom: 1px solid #333; margin-top: 60px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    td, th { padding: 8px; text-align: left; border: 1px solid #ddd; }
    .checkbox { display: inline-block; width: 15px; height: 15px; border: 1px solid #333; margin-right: 5px; }
  </style>
</head>
<body>
  <h1>RESIDENTIAL LEASE AGREEMENT</h1>
  
  <div class="section">
    <p>This Lease Agreement ("Agreement") is made and entered into on <span class="field" data-field="lease_date">_________</span>,
    by and between:</p>
    
    <p><strong>LANDLORD:</strong> <span class="field" data-field="landlord_name">____________________</span>
    ("Landlord"), with a mailing address of <span class="field" data-field="landlord_address">____________________</span></p>
    
    <p><strong>TENANT:</strong> <span class="field" data-field="tenant_name">____________________</span>
    ("Tenant"), with a mailing address of <span class="field" data-field="tenant_address">____________________</span></p>
  </div>

  <h2>1. PROPERTY</h2>
  <div class="section">
    <p>Landlord hereby leases to Tenant the residential property located at:</p>
    <p><span class="field" data-field="property_address">____________________</span>
    ("Property"), specifically Unit <span class="field" data-field="unit_number">____</span>.</p>
  </div>

  <h2>2. TERM</h2>
  <div class="section">
    <p>The lease term shall begin on <span class="field" data-field="lease_start">_________</span>
    and end on <span class="field" data-field="lease_end">_________</span>
    ("Lease Term"), for a total period of <span class="field" data-field="lease_duration">12</span> months.</p>
  </div>

  <h2>3. RENT</h2>
  <div class="section">
    <p>Tenant agrees to pay Landlord a monthly rent of $<span class="field" data-field="rent_amount">_________</span>,
    due on the <span class="field" data-field="rent_due_day">1st</span> day of each month.</p>
    
    <p>Rent payments shall be made to: <span class="field" data-field="payment_method">____________________</span></p>
  </div>

  <h2>4. SECURITY DEPOSIT</h2>
  <div class="section">
    <p>Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of
    $<span class="field" data-field="security_deposit">_________</span> as security for any damage caused to the Property.</p>
  </div>

  <h2>5. UTILITIES</h2>
  <div class="section">
    <p>Tenant shall be responsible for payment of the following utilities:</p>
    <ul>
      <li><span class="field" data-field="utility_electric">[ ] Electricity</span></li>
      <li><span class="field" data-field="utility_gas">[ ] Gas</span></li>
      <li><span class="field" data-field="utility_water">[ ] Water</span></li>
      <li><span class="field" data-field="utility_internet">[ ] Internet/Cable</span></li>
    </ul>
  </div>

  <h2>6. USE OF PROPERTY</h2>
  <div class="section">
    <p>The Property shall be used strictly as a residential dwelling for <span class="field" data-field="occupants">____</span>
    occupants. The Property shall not be used for any commercial purpose.</p>
    
    <p><strong>Pet Policy:</strong> <span class="field" data-field="pet_policy">No pets allowed without written consent</span></p>
    
    <p><strong>Smoking Policy:</strong> <span class="field" data-field="smoking_policy">No smoking inside the Property</span></p>
  </div>

  <h2>7. MAINTENANCE AND REPAIRS</h2>
  <div class="section">
    <p>Tenant shall maintain the Property in a clean and sanitary condition. Tenant shall be
    responsible for any damage caused by Tenant's negligence or misuse.</p>
    
    <p>All maintenance requests must be submitted in writing to the Landlord.</p>
  </div>

  <h2>8. TERMINATION</h2>
  <div class="section">
    <p>Either party may terminate this Agreement by giving <span class="field" data-field="notice_period">30</span>
    days written notice prior to the end of the Lease Term.</p>
    
    <p><strong>Early Termination Fee:</strong> $<span class="field" data-field="early_termination_fee">_________</span></p>
  </div>

  <h2>9. GOVERNING LAW</h2>
  <div class="section">
    <p>This Agreement shall be governed by the laws of the State of <span class="field" data-field="state">New York</span>.</p>
  </div>

  <div class="signature-block">
    <h2>SIGNATURES</h2>
    
    <p>The parties have executed this Agreement as of the date first written above.</p>
    
    <div class="signatures">
      <div>
        <p><strong>LANDLORD:</strong></p>
        <div class="signature-line" data-field="landlord_signature"></div>
        <p>Signature</p>
        <div class="date-line" data-field="landlord_sign_date"></div>
        <p>Date</p>
      </div>
      
      <div>
        <p><strong>TENANT:</strong></p>
        <div class="signature-line" data-field="tenant_signature"></div>
        <p>Signature</p>
        <div class="date-line" data-field="tenant_sign_date"></div>
        <p>Date</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,
  fields: [
    { name: 'lease_date', type: 'date', required: true },
    { name: 'landlord_name', type: 'text', required: true },
    { name: 'landlord_address', type: 'text', required: true },
    { name: 'tenant_name', type: 'text', required: true },
    { name: 'tenant_address', type: 'text', required: true },
    { name: 'property_address', type: 'text', required: true },
    { name: 'unit_number', type: 'text', required: true },
    { name: 'lease_start', type: 'date', required: true },
    { name: 'lease_end', type: 'date', required: true },
    { name: 'lease_duration', type: 'number', required: true, defaultValue: '12' },
    { name: 'rent_amount', type: 'text', required: true },
    { name: 'rent_due_day', type: 'text', required: true, defaultValue: '1st' },
    { name: 'payment_method', type: 'text', required: true },
    { name: 'security_deposit', type: 'text', required: true },
    { name: 'utility_electric', type: 'checkbox', required: false },
    { name: 'utility_gas', type: 'checkbox', required: false },
    { name: 'utility_water', type: 'checkbox', required: false },
    { name: 'utility_internet', type: 'checkbox', required: false },
    { name: 'occupants', type: 'number', required: true, defaultValue: '1' },
    { name: 'pet_policy', type: 'text', required: true },
    { name: 'smoking_policy', type: 'text', required: true },
    { name: 'notice_period', type: 'number', required: true, defaultValue: '30' },
    { name: 'early_termination_fee', type: 'text', required: false },
    { name: 'state', type: 'text', required: true, defaultValue: 'New York' },
    { name: 'landlord_signature', type: 'signature', required: true },
    { name: 'landlord_sign_date', type: 'date', required: true },
    { name: 'tenant_signature', type: 'signature', required: true },
    { name: 'tenant_sign_date', type: 'date', required: true },
  ] as TemplateField[],
};

// Lease Renewal Template
export const leaseRenewalTemplate = {
  name: 'Lease Renewal Agreement',
  description: 'Agreement to renew an existing lease for another term',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lease Renewal Agreement</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #1a1a1a; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .section { margin-bottom: 20px; }
    .field { background-color: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-weight: bold; }
    .highlight { background-color: #e8f4f8; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
    .signature-block { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature-line { width: 250px; border-bottom: 1px solid #333; margin-top: 60px; }
    .date-line { width: 150px; border-bottom: 1px solid #333; margin-top: 60px; }
  </style>
</head>
<body>
  <h1>LEASE RENEWAL AGREEMENT</h1>
  
  <div class="section">
    <p>This Lease Renewal Agreement ("Renewal") is made and entered into on <span class="field" data-field="renewal_date">_________</span>,
    by and between:</p>
    
    <p><strong>LANDLORD:</strong> <span class="field" data-field="landlord_name">____________________</span></p>
    
    <p><strong>TENANT:</strong> <span class="field" data-field="tenant_name">____________________</span></p>
  </div>

  <div class="section">
    <p><strong>RE:</strong> Lease Agreement dated <span class="field" data-field="original_lease_date">_________</span>
    for the property located at <span class="field" data-field="property_address">____________________</span>,
    Unit <span class="field" data-field="unit_number">____</span>.</p>
  </div>

  <h2>RENEWAL TERMS</h2>
  
  <div class="highlight">
    <p><strong>The parties hereby agree to renew the Lease for the following term:</strong></p>
  </div>

  <div class="section">
    <p><strong>New Lease Term:</strong> From <span class="field" data-field="new_lease_start">_________</span>
    to <span class="field" data-field="new_lease_end">_________</span></p>
    
    <p><strong>Renewed Monthly Rent:</strong> $<span class="field" data-field="new_rent_amount">_________</span>
    (Previous rent: $<span class="field" data-field="previous_rent">_________</span>)</p>
    
    <p><strong>Rent Increase:</strong> $<span class="field" data-field="rent_increase">_________</span>
    (<span class="field" data-field="rent_increase_percent">____</span>%)</p>
  </div>

  <h2>TERMS AND CONDITIONS</h2>
  
  <div class="section">
    <p>1. All terms and conditions of the original Lease Agreement remain in full force and effect,
    except as expressly modified by this Renewal.</p>
    
    <p>2. Tenant acknowledges that the Property is in good condition and accepts it "as is"
    for the renewed term.</p>
    
    <p>3. No additional security deposit is required unless specified by local law.</p>
    
    <p>4. This Renewal constitutes the entire agreement between the parties regarding the renewal
    of the Lease.</p>
  </div>

  <h2>NOTICE REQUIREMENTS</h2>
  
  <div class="section">
    <p>Pursuant to applicable law, Tenant is hereby notified that:</p>
    
    <ul>
      <li>This renewal offer expires on <span class="field" data-field="offer_expiry">_________</span></li>
      <li>Tenant must provide <span class="field" data-field="notice_required">60</span> days notice
      if not renewing</li>
    </ul>
  </div>

  <div class="signature-block">
    <h2>SIGNATURES</h2>
    
    <p>The parties have executed this Renewal as of the date first written above.</p>
    
    <div class="signatures">
      <div>
        <p><strong>LANDLORD:</strong></p>
        <div class="signature-line" data-field="landlord_signature"></div>
        <p>Signature</p>
        <div class="date-line" data-field="landlord_sign_date"></div>
        <p>Date</p>
      </div>
      
      <div>
        <p><strong>TENANT:</strong></p>
        <div class="signature-line" data-field="tenant_signature"></div>
        <p>Signature</p>
        <div class="date-line" data-field="tenant_sign_date"></div>
        <p>Date</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,
  fields: [
    { name: 'renewal_date', type: 'date', required: true },
    { name: 'landlord_name', type: 'text', required: true },
    { name: 'tenant_name', type: 'text', required: true },
    { name: 'original_lease_date', type: 'date', required: true },
    { name: 'property_address', type: 'text', required: true },
    { name: 'unit_number', type: 'text', required: true },
    { name: 'new_lease_start', type: 'date', required: true },
    { name: 'new_lease_end', type: 'date', required: true },
    { name: 'new_rent_amount', type: 'text', required: true },
    { name: 'previous_rent', type: 'text', required: true },
    { name: 'rent_increase', type: 'text', required: false },
    { name: 'rent_increase_percent', type: 'text', required: false },
    { name: 'offer_expiry', type: 'date', required: true },
    { name: 'notice_required', type: 'number', required: true, defaultValue: '60' },
    { name: 'landlord_signature', type: 'signature', required: true },
    { name: 'landlord_sign_date', type: 'date', required: true },
    { name: 'tenant_signature', type: 'signature', required: true },
    { name: 'tenant_sign_date', type: 'date', required: true },
  ] as TemplateField[],
};

// Notice to Tenant Template
export const noticeToTenantTemplate = {
  name: 'Notice to Tenant',
  description: 'General notice to tenant for various purposes',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Notice to Tenant</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .header { margin-bottom: 30px; }
    .notice-type { background-color: #f0f0f0; padding: 10px; text-align: center; font-weight: bold; margin: 20px 0; }
    .section { margin-bottom: 20px; }
    .field { background-color: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-weight: bold; }
    .important { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; }
    .signature-block { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
    .signature-line { width: 300px; border-bottom: 1px solid #333; margin-top: 60px; }
    .date-line { width: 200px; border-bottom: 1px solid #333; margin-top: 60px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>OFFICIAL NOTICE</h1>
    <div class="notice-type">
      <span class="field" data-field="notice_type">NOTICE TYPE</span>
    </div>
  </div>
  
  <div class="section">
    <p><strong>Date:</strong> <span class="field" data-field="notice_date">_________</span></p>
    <p><strong>To:</strong> <span class="field" data-field="tenant_name">____________________</span></p>
    <p><strong>Property:</strong> <span class="field" data-field="property_address">____________________</span>,
    Unit <span class="field" data-field="unit_number">____</span></p>
  </div>

  <div class="section">
    <p>Dear <span class="field" data-field="tenant_name">____________________</span>,</p>
    
    <div class="important">
      <p><strong>RE: <span class="field" data-field="notice_subject">NOTICE SUBJECT</span></strong></p>
    </div>
    
    <p><span class="field" data-field="notice_body">[NOTICE CONTENT]</span></p>
  </div>

  <div class="section">
    <p><strong>Effective Date:</strong> <span class="field" data-field="effective_date">_________</span></p>
    
    <p><strong>Action Required By:</strong> <span class="field" data-field="action_required_by">_________</span></p>
    
    <p><strong>Contact Information:</strong></p>
    <p>If you have any questions regarding this notice, please contact:</p>
    <p><span class="field" data-field="contact_name">____________________</span><br>
    Phone: <span class="field" data-field="contact_phone">____________________</span><br>
    Email: <span class="field" data-field="contact_email">____________________</span></p>
  </div>

  <div class="section">
    <p><strong>Legal Notice:</strong></p>
    <p>This notice is provided in accordance with applicable landlord-tenant laws.
    Please retain this notice for your records.</p>
    
    <p><strong>Method of Delivery:</strong> <span class="field" data-field="delivery_method">____________________</span></p>
  </div>

  <div class="signature-block">
    <p>Sincerely,</p>
    
    <br><br>
    
    <div class="signature-line" data-field="landlord_signature"></div>
    <p><span class="field" data-field="landlord_name">____________________</span><br>
    Landlord/Property Manager</p>
    
    <div class="date-line" data-field="signature_date"></div>
    <p>Date</p>
  </div>
</body>
</html>
  `,
  fields: [
    { name: 'notice_type', type: 'select', required: true },
    { name: 'notice_date', type: 'date', required: true },
    { name: 'tenant_name', type: 'text', required: true },
    { name: 'property_address', type: 'text', required: true },
    { name: 'unit_number', type: 'text', required: true },
    { name: 'notice_subject', type: 'text', required: true },
    { name: 'notice_body', type: 'text', required: true },
    { name: 'effective_date', type: 'date', required: true },
    { name: 'action_required_by', type: 'date', required: false },
    { name: 'contact_name', type: 'text', required: true },
    { name: 'contact_phone', type: 'text', required: true },
    { name: 'contact_email', type: 'text', required: true },
    { name: 'delivery_method', type: 'text', required: true },
    { name: 'landlord_signature', type: 'signature', required: true },
    { name: 'landlord_name', type: 'text', required: true },
    { name: 'signature_date', type: 'date', required: true },
  ] as TemplateField[],
};

// NYC Good Cause Eviction Notice Template
export const goodCauseEvictionNoticeTemplate = {
  name: 'NYC Good Cause Eviction Notice',
  description: 'Required notice under NYC Good Cause Eviction law for non-renewal',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Notice of Non-Renewal - Good Cause Eviction</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; color: #1a1a1a; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
    .legal-notice { background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; }
    .legal-notice h2 { color: #dc2626; margin-top: 0; }
    .section { margin-bottom: 20px; }
    .field { background-color: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-weight: bold; }
    .signature-block { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature-line { width: 250px; border-bottom: 1px solid #333; margin-top: 60px; }
    .date-line { width: 150px; border-bottom: 1px solid #333; margin-top: 60px; }
    ul.requirements { background-color: #f9fafb; padding: 15px 15px 15px 40px; border-left: 4px solid #dc2626; }
  </style>
</head>
<body>
  <div class="legal-notice">
    <h2>⚠️ IMPORTANT LEGAL NOTICE</h2>
    <p>This notice is required under the New York City Good Cause Eviction Law
    (Local Law 55 of 2022). This is an official notice regarding your lease renewal rights.</p>
  </div>

  <h1>NOTICE OF NON-RENEWAL</h1>
  
  <div class="section">
    <p><strong>Date of Notice:</strong> <span class="field" data-field="notice_date">_________</span></p>
    
    <p><strong>To:</strong> <span class="field" data-field="tenant_name">____________________</span></p>
    
    <p><strong>Property Address:</strong> <span class="field" data-field="property_address">____________________</span>,
    Unit <span class="field" data-field="unit_number">____</span></p>
    
    <p><strong>Current Lease Term:</strong> <span class="field" data-field="current_lease_start">_________</span>
    to <span class="field" data-field="current_lease_end">_________</span></p>
  </div>

  <div class="section">
    <p>Dear <span class="field" data-field="tenant_name">____________________</span>,</p>
    
    <p>Please be advised that your landlord has elected <strong>NOT TO RENEW</strong> your lease
    agreement for the above-referenced property.</p>
    
    <p><strong>Reason for Non-Renewal (Good Cause Required):</strong></p>
    <p><span class="field" data-field="non_renewal_reason">[REASON]</span></p>
  </div>

  <div class="section">
    <h2>YOUR RIGHTS UNDER GOOD CAUSE EVICTION</h2>
    
    <ul class="requirements">
      <li>You have the right to remain in your unit on a month-to-month basis after your lease expires</li>
      <li>Your rent increase is limited to the greater of 10% or CPI + 5%</li>
      <li>You cannot be evicted without "good cause" as defined by law</li>
      <li>You have the right to challenge this notice in court</li>
    </ul>
  </div>

  <div class="section">
    <h2>NOTICE REQUIREMENTS</h2>
    
    <p>Under NYC law, this notice is being provided <span class="field" data-field="days_notice">90</span>
    days prior to your lease expiration date.</p>
    
    <p><strong>Your lease expires on:</strong> <span class="field" data-field="lease_expiration">_________</span></p>
    
    <p><strong>You must vacate by:</strong> <span class="field" data-field="vacate_date">_________</span>
    (unless you exercise your right to remain)</p>
  </div>

  <div class="section">
    <h2>LEGAL ASSISTANCE</h2>
    
    <p>If you believe this notice violates your rights under the Good Cause Eviction law,
    you may contact:</p>
    
    <ul>
      <li>NYC Tenant Helpline: 311</li>
      <li>Legal Services NYC: 917-661-4500</li>
      <li>Metropolitan Council on Housing: 212-627-2221</li>
    </ul>
  </div>

  <div class="signature-block">
    <h2>LANDLORD CERTIFICATION</h2>
    
    <p>I certify that the above information is true and correct, and that this notice
    complies with all applicable laws including the NYC Good Cause Eviction Law.</p>
    
    <div class="signatures">
      <div>
        <p><strong>LANDLORD:</strong></p>
        <div class="signature-line" data-field="landlord_signature"></div>
        <p>Signature</p>
        <div class="date-line" data-field="landlord_sign_date"></div>
        <p>Date</p>
      </div>
      
      <div>
        <p><strong>WITNESS (Optional):</strong></p>
        <div class="signature-line" data-field="witness_signature"></div>
        <p>Signature</p>
        <div class="date-line" data-field="witness_date"></div>
        <p>Date</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,
  fields: [
    { name: 'notice_date', type: 'date', required: true },
    { name: 'tenant_name', type: 'text', required: true },
    { name: 'property_address', type: 'text', required: true },
    { name: 'unit_number', type: 'text', required: true },
    { name: 'current_lease_start', type: 'date', required: true },
    { name: 'current_lease_end', type: 'date', required: true },
    { name: 'non_renewal_reason', type: 'text', required: true },
    { name: 'days_notice', type: 'number', required: true, defaultValue: '90' },
    { name: 'lease_expiration', type: 'date', required: true },
    { name: 'vacate_date', type: 'date', required: true },
    { name: 'landlord_signature', type: 'signature', required: true },
    { name: 'landlord_sign_date', type: 'date', required: true },
    { name: 'witness_signature', type: 'signature', required: false },
    { name: 'witness_date', type: 'date', required: false },
  ] as TemplateField[],
};

// Export all templates
export const documentTemplates = {
  standardLease: standardLeaseTemplate,
  leaseRenewal: leaseRenewalTemplate,
  noticeToTenant: noticeToTenantTemplate,
  goodCauseEvictionNotice: goodCauseEvictionNoticeTemplate,
};

// Helper function to create template in DocuSeal
export async function createDocuSealTemplate(
  templateType: keyof typeof documentTemplates
) {
  const template = documentTemplates[templateType];
  if (!template) {
    throw new Error(`Template type '${templateType}' not found`);
  }
  return template;
}

export default documentTemplates;
