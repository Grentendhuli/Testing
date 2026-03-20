/**
 * Email Service
 * Sends transactional emails via Cloudflare Worker (keeps SendGrid API key server-side)
 * Free tier: 100 emails/day
 */

import { sanitizeText } from '@/lib/sanitize';

const WORKER_URL = (import.meta as any).env?.VITE_CLOUDFLARE_WORKER_URL || 'https://landlordbot-ai.your-account.workers.dev';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PaymentDetails {
  tenantName: string;
  unitNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber?: string;
}

interface MaintenanceRequestDetails {
  requestId: string;
  title: string;
  status: 'submitted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  description?: string;
  updatedAt: string;
  notes?: string;
}

interface UnitDetails {
  unitNumber: string;
  tenantName: string;
  rentAmount: number;
  dueDate: string;
  daysLate: number;
  lateFee?: number;
}

/**
 * Send email via Cloudflare Worker (SendGrid API key is server-side only)
 */
async function sendEmail({ to, subject, html, text }: EmailData): Promise<{ success: boolean; error?: string }> {
  // Check if Worker URL is configured
  if (!WORKER_URL || WORKER_URL.includes('your-account')) {
    console.warn('[Email] Cloudflare Worker URL not configured. Email not sent:', { to, subject });
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${WORKER_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
      }),
    });

    const data = await response.json().catch(() => ({ error: 'Invalid response' }));

    if (response.ok && data.success) {
      console.log('[Email] Email sent successfully:', { to, subject });
      return { success: true };
    } else {
      console.error('[Email] API error:', data.error);
      return { success: false, error: data.error || 'Failed to send email' };
    }
  } catch (error) {
    console.error('[Email] Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  userEmail: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const sanitizedFirstName = sanitizeText(firstName);
  const subject = `Welcome to LandlordBot, ${sanitizedFirstName}! 🏠`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LandlordBot</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🏠 LandlordBot</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Welcome aboard, ${sanitizedFirstName}!</h2>
              
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for joining LandlordBot! We're excited to help you streamline your property management with AI-powered tools.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">🚀 Get Started with These Features:</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>AI-powered tenant communication</li>
                  <li>Rent collection tracking</li>
                  <li>Maintenance request management</li>
                  <li>Financial reporting & analytics</li>
                </ul>
              </div>
              
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Your free plan includes <strong>unlimited units</strong> and <strong>unlimited AI messages</strong>. Upgrade to Concierge anytime for professional support!
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${(import.meta as any).env?.VITE_APP_URL || 'https://landlordbot.live'}/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">
                Need help? Contact us at <a href="mailto:support@landlordbot.live" style="color: #f59e0b; text-decoration: none;">support@landlordbot.live</a>
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LandlordBot. All rights reserved.<br>
                <a href="${import.meta.env.VITE_APP_URL || 'https://landlordbot.live'}/unsubscribe" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

/**
 * Send rent receipt email to tenant
 */
export async function sendRentReceiptEmail(
  tenantEmail: string,
  paymentDetails: PaymentDetails
): Promise<{ success: boolean; error?: string }> {
  const { tenantName, unitNumber, amount, paymentDate, paymentMethod, receiptNumber } = paymentDetails;
  const sanitizedTenantName = sanitizeText(tenantName);
  const sanitizedUnitNumber = sanitizeText(unitNumber);
  const sanitizedPaymentMethod = sanitizeText(paymentMethod);
  const subject = `Rent Receipt - ${sanitizedUnitNumber} - $${amount.toFixed(2)}`;
  const receiptNum = receiptNumber || `RCP-${Date.now()}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rent Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Payment Received</h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Receipt #${receiptNum}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${sanitizedTenantName},
              </p>
              
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for your rent payment. This email confirms your payment has been received and processed.
              </p>
              
              <!-- Receipt Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #94a3b8; font-size: 14px;">Amount Paid</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <span style="color: #059669; font-size: 20px; font-weight: 700;">$${amount.toFixed(2)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #94a3b8; font-size: 14px;">Unit</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <span style="color: #1e293b; font-size: 14px;">${sanitizedUnitNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #94a3b8; font-size: 14px;">Payment Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <span style="color: #1e293b; font-size: 14px;">${new Date(paymentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">Payment Method</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1e293b; font-size: 14px;">${sanitizedPaymentMethod}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #065f46; font-size: 14px; margin: 0; text-align: center;">
                  ✓ This receipt serves as proof of payment for your records.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">
                Questions about your payment? Contact your property manager.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LandlordBot. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: tenantEmail, subject, html });
}

/**
 * Send maintenance request update email to tenant
 */
export async function sendMaintenanceUpdateEmail(
  tenantEmail: string,
  requestDetails: MaintenanceRequestDetails
): Promise<{ success: boolean; error?: string }> {
  const { requestId, title, status, priority, description, updatedAt, notes } = requestDetails;
  
  // Sanitize user-controlled inputs
  const sanitizedTitle = sanitizeText(title);
  const sanitizedRequestId = sanitizeText(requestId);
  const sanitizedDescription = description ? sanitizeText(description) : '';
  const sanitizedNotes = notes ? sanitizeText(notes) : '';
  
  const statusConfig = {
    submitted: { label: 'Received', color: '#3b82f6', bg: '#dbeafe' },
    in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
    completed: { label: 'Completed', color: '#10b981', bg: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  };
  
  const statusInfo = statusConfig[status];
  const subject = `Maintenance Update: ${sanitizedTitle}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🔧</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Maintenance Update</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">${sanitizedTitle}</h2>
              
              <div style="margin: 20px 0;">
                <span style="display: inline-block; background-color: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                  ${statusInfo.label}
                </span>
                <span style="display: inline-block; background-color: ${priority === 'emergency' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : '#f1f5f9'}; color: ${priority === 'emergency' ? '#dc2626' : priority === 'high' ? '#d97706' : '#64748b'}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-left: 8px;">
                  ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                </span>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
                <strong>Request ID:</strong> ${sanitizedRequestId}
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
                <strong>Updated:</strong> ${new Date(updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              
              ${description ? `
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">${sanitizedDescription}</p>
              </div>
              ` : ''}
              
              ${notes ? `
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📝 Update Notes:</p>
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">${sanitizedNotes}</p>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">
                  We'll keep you updated on any progress. If you have questions or need immediate assistance, please contact your property manager.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">
                Emergency? Call your property manager immediately.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LandlordBot. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: tenantEmail, subject, html });
}

/**
 * Send late payment reminder email to tenant
 */
export async function sendLatePaymentReminder(
  tenantEmail: string,
  unitDetails: UnitDetails
): Promise<{ success: boolean; error?: string }> {
  const { unitNumber, tenantName, rentAmount, dueDate, daysLate, lateFee } = unitDetails;
  
  // Sanitize user-controlled inputs
  const sanitizedTenantName = sanitizeText(tenantName);
  const sanitizedUnitNumber = sanitizeText(unitNumber);
  
  const subject = `Payment Reminder: Rent Due for ${sanitizedUnitNumber}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Payment Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${sanitizedTenantName},
              </p>
              
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                This is a friendly reminder that your rent payment is currently <strong style="color: #dc2626;">${daysLate} days overdue</strong>.
              </p>
              
              <!-- Payment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                          <span style="color: #7f1d1d; font-size: 14px;">Unit</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; text-align: right;">
                          <span style="color: #7f1d1d; font-size: 14px; font-weight: 600;">${sanitizedUnitNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                          <span style="color: #7f1d1d; font-size: 14px;">Rent Amount</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; text-align: right;">
                          <span style="color: #7f1d1d; font-size: 14px; font-weight: 600;">$${rentAmount.toFixed(2)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                          <span style="color: #7f1d1d; font-size: 14px;">Due Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; text-align: right;">
                          <span style="color: #7f1d1d; font-size: 14px; font-weight: 600;">${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                          <span style="color: #7f1d1d; font-size: 14px;">Days Late</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; text-align: right;">
                          <span style="color: #dc2626; font-size: 14px; font-weight: 600;">${daysLate} days</span>
                        </td>
                      </tr>
                      ${lateFee ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
                          <span style="color: #7f1d1d; font-size: 14px;">Late Fee</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; text-align: right;">
                          <span style="color: #dc2626; font-size: 14px; font-weight: 600;">$${lateFee.toFixed(2)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 8px 0;">
                          <span style="color: #7f1d1d; font-size: 16px; font-weight: 700;">Total Due</span>
                        </td>
                        <td style="padding: 12px 0 8px 0; text-align: right;">
                          <span style="color: #dc2626; font-size: 18px; font-weight: 700;">$${(rentAmount + lateFee).toFixed(2)}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #9a3412; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>Please submit your payment as soon as possible</strong> to avoid additional late fees. If you're experiencing financial difficulties, please contact your property manager to discuss payment options.
                </p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${import.meta.env.VITE_APP_URL || 'https://landlordbot.live'}/tenant/payment" 
                       style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Pay Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">
                Questions? Contact your property manager.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LandlordBot. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: tenantEmail, subject, html });
}

/**
 * Send AI limit reached notification email
 */
export async function sendAILimitReachedEmail(
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  const subject = 'You\'ve Reached Your AI Message Limit';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Limit Reached</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🤖</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">AI Limit Reached</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                You've reached your monthly AI message limit on your current plan.
              </p>
              
              <div style="background-color: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #6b21a8; margin: 0 0 12px 0; font-size: 16px;">Upgrade for More AI Messages</h3>
                <p style="color: #7c3aed; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
                  Get unlimited AI messages and unlock premium features to supercharge your property management.
                </p>
                <ul style="color: #7c3aed; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                  <li>Unlimited AI tenant communication</li>
                  <li>Advanced financial analytics</li>
                  <li>Priority support</li>
                  <li>More units & storage</li>
                </ul>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${import.meta.env.VITE_APP_URL || 'https://landlordbot.live'}/settings/subscription" 
                       style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Upgrade Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Your AI message count will reset on the first day of next month.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">
                Need help? Contact us at <a href="mailto:support@landlordbot.live" style="color: #8b5cf6; text-decoration: none;">support@landlordbot.live</a>
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LandlordBot. All rights reserved.<br>
                <a href="${import.meta.env.VITE_APP_URL || 'https://landlordbot.live'}/settings/notifications" style="color: #94a3b8; text-decoration: underline;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

// Export all functions as default object for convenience
export default {
  sendWelcomeEmail,
  sendRentReceiptEmail,
  sendMaintenanceUpdateEmail,
  sendLatePaymentReminder,
  sendAILimitReachedEmail,
};