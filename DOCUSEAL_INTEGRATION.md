# DocuSeal Document Signing Integration

## Overview

LandlordBot now includes digital document signing capabilities powered by **DocuSeal**, an open-source alternative to DocuSign. This integration allows landlords to:

- Send lease agreements for digital signature
- Track document signing status in real-time
- Download signed documents
- Send reminders to pending signers
- Create document templates for various purposes

## Pricing Options

### Option 1: Self-Hosted (FREE - Recommended)
- **Cost**: Completely free
- **Documents**: Unlimited
- **Setup**: Requires self-hosting on your own server
- **Best For**: Landlords with technical resources or those who want complete control

**Setup Instructions:**
1. Deploy DocuSeal on your server: https://github.com/docusealco/docuseal
2. Set `VITE_DOCUSEAL_BASE_URL` to your server URL
3. Generate API key in DocuSeal settings
4. Set `VITE_DOCUSEAL_API_KEY` in your environment

### Option 2: DocuSeal Cloud (Pay-as-you-go)
- **Cost**: ~$0.50-$2.00 per document signed
- **Documents**: Pay only for what you use
- **Setup**: No server required
- **Best For**: Occasional use or testing

**Setup Instructions:**
1. Sign up at https://console.docuseal.com
2. Get your API key from Settings
3. Set `VITE_DOCUSEAL_API_KEY` in your environment
4. (Optional) Set `VITE_DOCUSEAL_BASE_URL` if using custom endpoint

### Option 3: DocuSeal Cloud Pro
- **Cost**: $20/month per user
- **Documents**: Unlimited
- **Setup**: No server required
- **Best For**: High-volume users

## Environment Variables

Add these to your `.env` file:

```env
# DocuSeal Configuration
VITE_DOCUSEAL_API_KEY=your_api_key_here
VITE_DOCUSEAL_BASE_URL=https://api.docuseal.com  # Optional: for self-hosted
VITE_DOCUSEAL_WEBHOOK_SECRET=your_webhook_secret  # Optional: for webhooks
VITE_DOCUSEAL_LEASE_TEMPLATE_ID=your_template_id  # Optional: default template

# Landlord Information (for signing)
VITE_LANDLORD_EMAIL=your@email.com
VITE_LANDLORD_NAME=Your Name
```

## Features

### 1. Send Lease for Signature

From the Leases page, expand any lease and click "Send for Signature" to:
- Generate a signing request
- Email the tenant with a secure signing link
- Track when the document is opened and signed
- Receive notifications on completion

### 2. Document Status Tracking

The Leases page now includes:
- **Pending Signatures**: List of documents awaiting signature
- **Signed Documents**: Quick access to completed agreements
- **Status Indicators**: Visual badges showing signing progress

### 3. Document Templates

Pre-built templates included:
- **Standard Residential Lease**: Full lease agreement with all standard clauses
- **Lease Renewal Agreement**: For renewing existing leases
- **Notice to Tenant**: General purpose notices
- **NYC Good Cause Eviction Notice**: Compliant with NYC Local Law 55

### 4. Webhook Support

DocuSeal can send real-time updates when:
- Document is opened by signer
- Document is signed
- All parties have completed signing
- Document expires

**Webhook Endpoint**: Configure in DocuSeal dashboard to point to your `/api/webhooks/docuseal` endpoint

## Usage Examples

### Send a Lease for Signature

```typescript
import { sendLeaseForSignature } from '../services/docuseal';
import type { Lease } from '../types';

const lease: Lease = {
  id: 'lease-123',
  unitId: 'unit-456',
  unitNumber: '2A',
  tenantName: 'John Doe',
  tenantEmail: 'john@example.com',
  tenantPhone: '555-123-4567',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  rentAmount: 2500,
  securityDeposit: 2500,
  leaseType: 'fixed-term',
  status: 'active',
  notes: '',
};

const submission = await sendLeaseForSignature(
  lease,
  'template-id-here',
  'landlord@example.com',
  'Property Manager'
);

console.log('Signing URL:', submission.id);
```

### Check Document Status

```typescript
import { getDocumentStatus } from '../services/docuseal';

const status = await getDocumentStatus('submission-id-here');
console.log('Status:', status.status); // 'pending', 'signed', 'completed'
console.log('Signed by:', status.submitters);
```

### Download Signed Document

```typescript
import { getSignedDocumentUrl } from '../services/docuseal';

const downloadUrl = await getSignedDocumentUrl('submission-id-here');
window.open(downloadUrl, '_blank');
```

### Create Custom Template

```typescript
import { createTemplateFromHTML } from '../services/docuseal';

const template = await createTemplateFromHTML(
  'My Custom Lease',
  '<html>...</html>',
  [
    { name: 'tenant_name', type: 'text', required: true },
    { name: 'rent_amount', type: 'text', required: true },
    { name: 'tenant_signature', type: 'signature', required: true },
  ]
);
```

## Components

### DocumentSigning

Main component for sending and tracking document signatures:

```tsx
import { DocumentSigning } from '../components/DocumentSigning';

<DocumentSigning
  lease={lease}
  templateId="template-id"
  landlordEmail="landlord@example.com"
  landlordName="Property Manager"
  onStatusChange={(status) => console.log(status)}
/>
```

### DocumentStatusTracker

Displays pending signatures across all leases:

```tsx
import { DocumentStatusTracker } from '../components/DocumentSigning';

<DocumentStatusTracker
  leases={leases}
  templateId="template-id"
  landlordEmail="landlord@example.com"
  landlordName="Property Manager"
/>
```

### SignedDocumentsList

Shows all completed signed documents:

```tsx
import { SignedDocumentsList } from '../components/DocumentSigning';

<SignedDocumentsList leases={leases} />
```

## API Reference

See `src/services/docuseal.ts` for full API documentation.

### Key Functions

- `createTemplateFromHTML()` - Create template from HTML
- `createTemplateFromPDF()` - Create template from PDF URL
- `sendDocumentForSignature()` - Send document for signing
- `sendLeaseForSignature()` - Convenience function for leases
- `getDocumentStatus()` - Check signing status
- `getSignedDocumentUrl()` - Get download URL
- `sendReminder()` - Send reminder email
- `cancelSubmission()` - Cancel signing request

## Security

- All API requests use HTTPS
- API keys are stored in environment variables
- Webhook signatures can be verified
- Documents are stored securely by DocuSeal
- Audit logs track all signing activity

## Compliance

- **ESIGN Act Compliant**: Electronic signatures are legally binding
- **UETA Compliant**: Follows Uniform Electronic Transactions Act
- **NYC Local Law 55**: Good Cause Eviction notice template included
- **Audit Trails**: Complete history of document access and signing

## Troubleshooting

### "DocuSeal API key not configured"
- Set `VITE_DOCUSEAL_API_KEY` in your `.env` file
- Restart your development server

### "Template not found"
- Verify template ID is correct
- Check that template exists in your DocuSeal account
- Ensure API key has access to the template

### "Document not yet signed"
- Document is still pending signature
- Check status with `getDocumentStatus()`
- Send reminder if needed

### Webhooks not working
- Verify webhook URL is accessible from internet
- Check webhook secret matches `VITE_DOCUSEAL_WEBHOOK_SECRET`
- Review webhook logs in DocuSeal dashboard

## Support

- **DocuSeal Docs**: https://www.docuseal.com/docs
- **API Reference**: https://www.docuseal.com/docs/api
- **GitHub**: https://github.com/docusealco/docuseal
- **LandlordBot Support**: support@landlordbot.live

## Migration from Other Services

### From DocuSign
1. Export templates as PDF
2. Upload to DocuSeal
3. Re-create form fields
4. Update API calls to use DocuSeal functions

### From HelloSign/Dropbox Sign
1. Download signed documents
2. Import to DocuSeal
3. Recreate active signature requests
4. Update integration code

## Future Enhancements

- [ ] Bulk sending to multiple tenants
- [ ] Template editor UI
- [ ] Automatic lease renewal workflows
- [ ] Integration with payment processing
- [ ] Mobile app for signing
- [ ] Blockchain document verification
