# LandlordBot Cloudflare Worker

Serverless functions for LandlordBot running on Cloudflare's edge network.

## Features

- **AI Chat** (`POST /ai/chat`) - Google Gemini integration
- **Email Sending** (`POST /email/send`) - SendGrid integration  
- **Voice Calls** (`POST /vapi/call`) - Vapi AI voice calling

## Why Cloudflare Worker?

Your API keys (Gemini, SendGrid, Vapi) stay **server-side only** — never exposed to the browser.

## Quick Deploy

### 1. Install Wrangler
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Set Secrets

```bash
# Gemini API (get at https://makersuite.google.com/app/apikey)
wrangler secret put GEMINI_API_KEY

# SendGrid (get at https://app.sendgrid.com/settings/api_keys)
wrangler secret put SENDGRID_API_KEY

# From email (must be verified in SendGrid)
wrangler secret put FROM_EMAIL

# Vapi (optional - for voice calls)
wrangler secret put VAPI_API_KEY
wrangler secret put VAPI_ASSISTANT_ID
wrangler secret put VAPI_PHONE_NUMBER_ID

# Environment marker
wrangler secret put ENVIRONMENT
# Enter: production
```

### 4. Deploy
```bash
npm run deploy
```

Copy the deployed URL (e.g., `https://landlordbot-worker.your-account.workers.dev`)

### 5. Add to Vercel

In Vercel dashboard → Environment Variables:

```
VITE_CLOUDFLARE_WORKER_URL=https://landlordbot-worker.your-account.workers.dev
```

Redeploy your app.

## API Usage Examples

### AI Chat
```javascript
const response = await fetch('https://your-worker.workers.dev/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How do I handle a late rent payment?',
    type: 'tenant-chat',
    context: { totalUnits: 5, occupancyRate: 80 }
  })
});

const data = await response.json();
// { success: true, response: "..." }
```

### Send Email
```javascript
const response = await fetch('https://your-worker.workers.dev/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'tenant@example.com',
    subject: 'Rent Receipt',
    html: '<h1>Payment Received</h1>...'
  })
});
```

### Voice Call
```javascript
const response = await fetch('https://your-worker.workers.dev/vapi/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+12125551234',
    message: 'Hello, this is about your maintenance request.'
  })
});
```

## Free Tier Limits

- **100,000 requests/day** — more than enough
- **10ms CPU time/request** — plenty for API calls
- **128MB RAM**

## Troubleshooting

**CORS errors?** The worker adds CORS headers automatically. Check browser console for actual error.

**Gemini not responding?** Verify GEMINI_API_KEY is set: `wrangler secret list`

**Emails not sending?** Check SendGrid sender verification status.

**Deployment failing?** Make sure you're in the `cloudflare-worker/` directory.

## Monitoring

View logs in real-time:
```bash
wrangler tail
```

## Development

Run locally:
```bash
npm run dev
```

Test with curl:
```bash
curl -X POST http://localhost:8787/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "type": "tenant-chat"}'
```
