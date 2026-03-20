/**
 * DocuSeal Document Signing Service
 * Open-source alternative to DocuSign
 * 
 * PRICING OPTIONS:
 * 1. Self-hosted (FREE): Deploy on your own server - unlimited documents
 * 2. Cloud API (Pay-as-you-go): ~$0.50-2.00 per document signed
 * 3. Cloud Pro: $20/month per user
 * 
 * Setup:
 * - Self-hosted: https://github.com/docusealco/docuseal
 * - Cloud: https://console.docuseal.com
 * 
 * API Docs: https://www.docuseal.com/docs/api
 */

import type { Lease } from '../types';

// Configuration
const DOCUSEAL_BASE_URL = (import.meta as any).env?.VITE_DOCUSEAL_BASE_URL || 'https://api.docuseal.com';
const DOCUSEAL_API_KEY = (import.meta as any).env?.VITE_DOCUSEAL_API_KEY;
const DOCUSEAL_WEBHOOK_SECRET = (import.meta as any).env?.VITE_DOCUSEAL_WEBHOOK_SECRET;

// Document signing status
export type DocumentStatus = 'pending' | 'signed' | 'completed' | 'expired' | 'cancelled';

// Template field types
export type FieldType = 'text' | 'number' | 'date' | 'signature' | 'initials' | 'checkbox' | 'select';

// Template field definition
export interface TemplateField {
  name: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  page?: number;
}

// Template definition
export interface DocumentTemplate {
  id?: string;
  name: string;
  description?: string;
  html?: string;
  pdfUrl?: string;
  fields: TemplateField[];
  submitters?: SubmitterConfig[];
  createdAt?: string;
  updatedAt?: string;
}

// Submitter configuration
export interface SubmitterConfig {
  name?: string;
  email?: string;
  role?: string;
  order?: number;
}

// Document submission (signing request)
export interface DocumentSubmission {
  id?: string;
  templateId: string;
  submitters: Submitter[];
  status?: DocumentStatus;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  auditLogUrl?: string;
  documentsUrl?: string;
}

// Submitter for signing
export interface Submitter {
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  values?: Record<string, string>;
  sendEmail?: boolean;
  sendSms?: boolean;
  order?: number;
}

// Signing status response
export interface SigningStatus {
  id: string;
  status: DocumentStatus;
  submitters: Array<{
    email: string;
    name?: string;
    status: 'pending' | 'signed' | 'opened';
    signedAt?: string;
    openedAt?: string;
  }>;
  completedAt?: string;
  documents: Array<{
    name: string;
    url: string;
    signedUrl?: string;
  }>;
}

// Error response
interface DocuSealError {
  error: string;
  message?: string;
}

/**
 * Check if DocuSeal is configured
 */
export function isDocuSealConfigured(): boolean {
  return !!DOCUSEAL_API_KEY;
}

/**
 * Make authenticated request to DocuSeal API
 */
async function docusealRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!DOCUSEAL_API_KEY) {
    throw new Error('DocuSeal API key not configured. Set VITE_DOCUSEAL_API_KEY in your environment.');
  }

  const url = `${DOCUSEAL_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${DOCUSEAL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as DocuSealError;
    throw new Error(`DocuSeal API error: ${error.error || error.message || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Create a document template from HTML
 * Use this to create lease agreement templates
 */
export async function createTemplateFromHTML(
  name: string,
  html: string,
  fields: TemplateField[],
  submitters?: SubmitterConfig[]
): Promise<DocumentTemplate> {
  const template = await docusealRequest<DocumentTemplate>('/templates', {
    method: 'POST',
    body: JSON.stringify({
      name,
      html,
      fields: fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required ?? true,
        default_value: f.defaultValue,
        x: f.x,
        y: f.y,
        w: f.width,
        h: f.height,
        page: f.page || 1,
      })),
      submitters: submitters || [{ role: 'Tenant' }, { role: 'Landlord' }],
    }),
  });

  console.log('[DocuSeal] Template created:', template.id);
  return template;
}

/**
 * Create a document template from PDF URL
 */
export async function createTemplateFromPDF(
  name: string,
  pdfUrl: string,
  fields: TemplateField[],
  submitters?: SubmitterConfig[]
): Promise<DocumentTemplate> {
  const template = await docusealRequest<DocumentTemplate>('/templates', {
    method: 'POST',
    body: JSON.stringify({
      name,
      source: 'link',
      url: pdfUrl,
      fields: fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required ?? true,
        default_value: f.defaultValue,
        x: f.x,
        y: f.y,
        w: f.width,
        h: f.height,
        page: f.page || 1,
      })),
      submitters: submitters || [{ role: 'Tenant' }, { role: 'Landlord' }],
    }),
  });

  console.log('[DocuSeal] PDF Template created:', template.id);
  return template;
}

/**
 * Get all templates
 */
export async function getTemplates(): Promise<DocumentTemplate[]> {
  return docusealRequest<DocumentTemplate[]>('/templates');
}

/**
 * Get a specific template
 */
export async function getTemplate(templateId: string): Promise<DocumentTemplate> {
  return docusealRequest<DocumentTemplate>(`/templates/${templateId}`);
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  await docusealRequest<void>(`/templates/${templateId}`, {
    method: 'DELETE',
  });
  console.log('[DocuSeal] Template deleted:', templateId);
}

/**
 * Send a document for signature
 * Creates a submission from a template
 */
export async function sendDocumentForSignature(
  templateId: string,
  submitters: Submitter[],
  options?: {
    message?: string;
    subject?: string;
    expiresAt?: string;
    reminderInterval?: number; // days
  }
): Promise<DocumentSubmission> {
  const submission = await docusealRequest<DocumentSubmission>('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      template_id: templateId,
      submitters: submitters.map(s => ({
        email: s.email,
        name: s.name,
        phone: s.phone,
        role: s.role || 'Tenant',
        values: s.values || {},
        send_email: s.sendEmail ?? true,
        send_sms: s.sendSms ?? false,
        order: s.order || 1,
      })),
      message: options?.message,
      subject: options?.subject,
      expires_at: options?.expiresAt,
      reminder_interval: options?.reminderInterval,
    }),
  });

  console.log('[DocuSeal] Document sent for signature:', submission.id);
  return submission;
}

/**
 * Send lease for signature
 * Convenience function for lease agreements
 */
export async function sendLeaseForSignature(
  lease: Lease,
  templateId: string,
  landlordEmail: string,
  landlordName: string,
  options?: {
    message?: string;
    subject?: string;
    expiresAt?: string;
  }
): Promise<DocumentSubmission> {
  const submitters: Submitter[] = [
    {
      email: lease.tenantEmail,
      name: lease.tenantName,
      role: 'Tenant',
      sendEmail: true,
      order: 1,
      values: {
        tenant_name: lease.tenantName,
        tenant_email: lease.tenantEmail,
        tenant_phone: lease.tenantPhone,
        unit_number: lease.unitNumber,
        rent_amount: lease.rentAmount.toString(),
        security_deposit: lease.securityDeposit.toString(),
        lease_start: lease.startDate,
        lease_end: lease.endDate,
        lease_type: lease.leaseType,
      },
    },
    {
      email: landlordEmail,
      name: landlordName,
      role: 'Landlord',
      sendEmail: true,
      order: 2,
    },
  ];

  return sendDocumentForSignature(templateId, submitters, {
    subject: options?.subject || `Lease Agreement for ${lease.unitNumber} - Signature Required`,
    message: options?.message || `Please review and sign the lease agreement for ${lease.unitNumber}. The monthly rent is $${lease.rentAmount}.`,
    expiresAt: options?.expiresAt,
  });
}

/**
 * Get document signing status
 */
export async function getDocumentStatus(submissionId: string): Promise<SigningStatus> {
  return docusealRequest<SigningStatus>(`/submissions/${submissionId}`);
}

/**
 * Get all submissions for a template
 */
export async function getTemplateSubmissions(templateId: string): Promise<DocumentSubmission[]> {
  return docusealRequest<DocumentSubmission[]>(`/templates/${templateId}/submissions`);
}

/**
 * Download signed document
 * Returns URL to download the signed PDF
 */
export async function getSignedDocumentUrl(submissionId: string): Promise<string> {
  const status = await getDocumentStatus(submissionId);
  
  if (status.status !== 'completed' && status.status !== 'signed') {
    throw new Error(`Document not yet signed. Current status: ${status.status}`);
  }

  // Return the first document URL
  if (status.documents && status.documents.length > 0) {
    return status.documents[0].signedUrl || status.documents[0].url;
  }

  throw new Error('No documents found for this submission');
}

/**
 * Cancel a submission
 */
export async function cancelSubmission(submissionId: string): Promise<void> {
  await docusealRequest<void>(`/submissions/${submissionId}`, {
    method: 'DELETE',
  });
  console.log('[DocuSeal] Submission cancelled:', submissionId);
}

/**
 * Send reminder to pending signers
 */
export async function sendReminder(submissionId: string): Promise<void> {
  await docusealRequest<void>(`/submissions/${submissionId}/remind`, {
    method: 'POST',
  });
  console.log('[DocuSeal] Reminder sent for submission:', submissionId);
}

/**
 * Verify webhook signature
 * Use this to verify webhook callbacks from DocuSeal
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!DOCUSEAL_WEBHOOK_SECRET) {
    console.warn('[DocuSeal] Webhook secret not configured, skipping verification');
    return true;
  }

  // In a real implementation, you would verify the HMAC signature
  // This is a placeholder for the actual verification logic
  console.log('[DocuSeal] Webhook signature verification (placeholder)');
  return true;
}

/**
 * Handle webhook events
 */
export function handleWebhookEvent(payload: {
  event: 'submission.completed' | 'submission.opened' | 'submission.signed' | 'submission.expired';
  data: {
    submission_id: string;
    template_id: string;
    submitter_email?: string;
    timestamp: string;
  };
}): void {
  console.log('[DocuSeal] Webhook received:', payload.event, payload.data);

  switch (payload.event) {
    case 'submission.completed':
      // Document fully signed by all parties
      console.log('[DocuSeal] Document fully signed:', payload.data.submission_id);
      break;
    case 'submission.signed':
      // One party signed
      console.log('[DocuSeal] Document signed by:', payload.data.submitter_email);
      break;
    case 'submission.opened':
      // Document opened by signer
      console.log('[DocuSeal] Document opened by:', payload.data.submitter_email);
      break;
    case 'submission.expired':
      // Document expired
      console.log('[DocuSeal] Document expired:', payload.data.submission_id);
      break;
  }
}

/**
 * Create document from template with pre-filled values
 */
export async function createDocumentFromTemplate(
  templateId: string,
  values: Record<string, string>,
  submitters: Submitter[]
): Promise<DocumentSubmission> {
  // Pre-fill values for submitters
  const submittersWithValues = submitters.map(s => ({
    ...s,
    values: {
      ...values,
      ...s.values,
    },
  }));

  return sendDocumentForSignature(templateId, submittersWithValues);
}

// Export all functions as default
export default {
  isDocuSealConfigured,
  createTemplateFromHTML,
  createTemplateFromPDF,
  getTemplates,
  getTemplate,
  deleteTemplate,
  sendDocumentForSignature,
  sendLeaseForSignature,
  getDocumentStatus,
  getTemplateSubmissions,
  getSignedDocumentUrl,
  cancelSubmission,
  sendReminder,
  verifyWebhookSignature,
  handleWebhookEvent,
  createDocumentFromTemplate,
};
