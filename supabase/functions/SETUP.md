# Supabase Edge Functions Setup

## Welcome Email Function

This Edge Function sends a personalized welcome email to new users via Resend.

### Setup Steps

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Set environment variable in Supabase**:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key
   ```

4. **Deploy the function**:
   ```bash
   supabase functions deploy welcome-email
   ```

5. **Test the function**:
   ```bash
   curl -X POST "https://your-project.supabase.co/functions/v1/welcome-email" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "firstName": "Test"}'
   ```

### Get Resend API Key

1. Go to https://resend.com
2. Sign up for free (100 emails/day on free tier)
3. Create an API key
4. Add domain verification for `landlordbot.app` (or use test domain)

### Verify Domain (Optional)

For production, add DNS records:
- Type: TXT
- Name: _resend.your-domain.com
- Value: [from Resend dashboard]

Or skip verification and use `resend.dev` domain for testing.

### Email Content

The welcome email includes:
- Personal greeting with first name
- Intro from the NYC Pro Advisor
- CTA to add first property
- Direct reply address (concierge@landlordbot.app)
- Mobile-friendly HTML template

### Monitoring

Check function logs:
```bash
supabase functions logs welcome-email --tail
```
