# SendGrid Email Integration Setup

This document outlines the SendGrid email service integration for LandlordBot transactional emails.

## Overview

SendGrid is used to send transactional emails including:
- Welcome emails for new users
- Rent payment receipts to tenants
- Maintenance request updates
- Late payment reminders
- AI quota limit notifications

**Free Tier:** 100 emails/day (perfect for startup/development)

## Setup Instructions

### 1. Create SendGrid Account

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Click "Start for free"
3. Sign up with your email (use the same email as your LandlordBot account)
4. Verify your email address
5. Complete the account setup (company name, website, etc.)

### 2. Create API Key

1. Log in to SendGrid Dashboard
2. Go to **Settings** > **API Keys** (left sidebar)
3. Click **Create API Key**
4. Name: `LandlordBot Production` (or `LandlordBot Development`)
5. Select **Restricted Key** (recommended for security)
6. Under **Mail Send**, enable:
   - `Mail Send` - Full Access
7. Click **Create & View**
8. **COPY THE API KEY IMMEDIATELY** (it won't be shown again!)

### 3. Configure Sender Authentication

1. Go to **Settings** > **Sender Authentication**
2. Complete **Single Sender Verification**:
   - Click "Verify a Single Sender"
   - Fill in your details:
     - From Name: `LandlordBot`
     - From Email: `noreply@landlordbot.live` (or your domain)
     - Reply To: `support@landlordbot.live`
   - Click "Create"
   - Check your email and click the verification link

**For Production:** Set up **Domain Authentication** (recommended)
- Go to **Settings** > **Sender Authentication** > **Domain Authentication**
- Follow the DNS setup instructions for your domain

### 4. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# SendGrid Configuration
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SENDGRID_FROM_EMAIL=noreply@landlordbot.live
```

**Note:** The API key starts with `SG.` and is approximately 69 characters long.

### 5. Test the Integration

1. Start the development server: `npm run dev`
2. Create a new test account
3. Check that you receive the welcome email
4. Record a rent payment for a tenant with an email
5. Check that the tenant receives the receipt email

## Email Templates

All email templates are located in `src/templates/emails/`:

- `welcome.html` - Welcome email for new users
- `rent-receipt.html` - Rent payment confirmation
- `maintenance-update.html` - Maintenance status updates
- `late-payment.html` - Late payment alerts
- `ai-limit-reached.html` - AI quota notifications

Templates use Handlebars-style variables like `{{firstName}}`, `{{amount}}`, etc.

## API Functions

All email functions are in `src/services/sendgrid.ts`:

### `sendWelcomeEmail(userEmail, firstName)`
Sends a welcome email after successful signup.

```typescript
import { sendWelcomeEmail } from '../services/sendgrid';

await sendWelcomeEmail('user@example.com', 'John');
```

### `sendRentReceiptEmail(tenantEmail, paymentDetails)`
Sends a rent payment receipt to tenant.

```typescript
import { sendRentReceiptEmail } from '../services/sendgrid';

await sendRentReceiptEmail('tenant@example.com', {
  tenantName: 'John Doe',
  unitNumber: '101',
  amount: 1500.00,
  paymentDate: '2024-03-15',
  paymentMethod: 'Online Payment',
  receiptNumber: 'RCP-123456',
});
```

### `sendMaintenanceUpdateEmail(tenantEmail, requestDetails)`
Sends maintenance request status updates.

```typescript
import { sendMaintenanceUpdateEmail } from '../services/sendgrid';

await sendMaintenanceUpdateEmail('tenant@example.com', {
  requestId: 'REQ-123',
  title: 'Leaky Faucet',
  status: 'in_progress',
  priority: 'medium',
  description: 'Kitchen sink faucet is dripping',
  updatedAt: '2024-03-15T10:00:00Z',
  notes: 'Plumber scheduled for tomorrow',
});
```

### `sendLatePaymentReminder(tenantEmail, unitDetails)`
Sends late payment reminder to tenant.

```typescript
import { sendLatePaymentReminder } from '../services/sendgrid';

await sendLatePaymentReminder('tenant@example.com', {
  unitNumber: '101',
  tenantName: 'John Doe',
  rentAmount: 1500.00,
  dueDate: '2024-03-01',
  daysLate: 5,
  lateFee: 75.00,
});
```

### `sendAILimitReachedEmail(userEmail)`
Sends notification when user hits AI quota.

```typescript
import { sendAILimitReachedEmail } from '../services/sendgrid';

await sendAILimitReachedEmail('user@example.com');
```

## Integration Points

### AuthContext.tsx
- Calls `sendWelcomeEmail()` after successful signup
- Gracefully handles email failures (doesn't block signup)

### RentCollection.tsx
- Calls `sendRentReceiptEmail()` after recording a payment with status 'paid'
- Only sends if tenant has an email address
- Gracefully handles email failures (doesn't block payment recording)

## Monitoring

Check SendGrid Dashboard for:
- Email delivery stats
- Bounce rates
- Spam reports
- Open rates
- Click rates

Go to: [https://app.sendgrid.com/statistics](https://app.sendgrid.com/statistics)

## Troubleshooting

### Emails not sending?
1. Check that `VITE_SENDGRID_API_KEY` is set in `.env.local`
2. Verify the API key has "Mail Send" permissions
3. Check browser console for error messages
4. Verify sender email is verified in SendGrid

### Emails going to spam?
1. Set up domain authentication in SendGrid
2. Use a consistent "From" name and email
3. Ensure unsubscribe links are present (already included in templates)
4. Monitor spam complaint rates in SendGrid dashboard

### API Key issues?
- API keys start with `SG.`
- If lost, create a new one (old one cannot be retrieved)
- Store securely and never commit to git

## Security Best Practices

1. **Never commit API keys to git** - Use `.env.local` (already in `.gitignore`)
2. **Use restricted API keys** - Only grant "Mail Send" permission
3. **Rotate keys periodically** - Create new keys every 6 months
4. **Monitor usage** - Check SendGrid dashboard for unusual activity
5. **Enable 2FA** on your SendGrid account

## Upgrading from Free Tier

When you need more than 100 emails/day:

1. Go to [SendGrid Pricing](https://sendgrid.com/pricing/)
2. Choose a plan based on your volume:
   - **Essentials**: 50,000 emails/month (~$19.95/month)
   - **Pro**: 100,000+ emails/month with dedicated IP
3. Update your billing information
4. No code changes needed!

## Support

- SendGrid Documentation: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- SendGrid Support: [https://support.sendgrid.com](https://support.sendgrid.com)
- LandlordBot Issues: Contact support@landlordbot.live