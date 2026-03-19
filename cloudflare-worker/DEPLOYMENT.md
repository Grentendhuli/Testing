# Cloudflare Worker Deployment Guide

## AI Assistant Worker

The AI Assistant requires a Cloudflare Worker to function. This worker uses Cloudflare's free AI tier with Llama 3.1.

### Prerequisites

1. Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Cloudflare API token with Workers permissions

### Deployment Steps

1. **Navigate to the worker directory:**
   ```bash
   cd cloudflare-worker
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy the worker:**
   ```bash
   wrangler deploy
   ```

4. **Get your worker URL:**
   After deployment, you'll see a URL like:
   ```
   https://landlordbot-ai.your-account.workers.dev
   ```

5. **Add to environment variables:**
   Add this URL to your Vercel environment variables:
   ```
   VITE_CLOUDFLARE_WORKER_URL=https://landlordbot-ai.your-account.workers.dev
   ```

### Worker Features

The worker provides:
- **Tenant Chat**: AI responses to tenant questions
- **Maintenance Triage**: Priority classification and cost estimates
- **Letter Drafting**: Professional landlord correspondence

### Free Tier Limits

Cloudflare Workers AI free tier:
- 10,000 requests per day
- Llama 3.1 8B model included
- No credit card required

### Troubleshooting

**Worker not responding:**
- Check wrangler.toml configuration
- Verify AI binding is enabled in Cloudflare dashboard

**CORS errors:**
- The worker handles CORS preflight automatically
- Ensure your Vercel domain is allowed

**AI not working:**
- Check Cloudflare AI is enabled in your account
- Verify the model name: `@cf/meta/llama-3.1-8b-instruct`

### Local Development

To test locally:
```bash
wrangler dev
```

This starts a local server at http://localhost:8787
