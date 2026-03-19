# Google Calendar API Integration - Environment Variables

## Overview
This document outlines the environment variables required for Google Calendar API integration in LandlordBot.

## Required Environment Variables

Add these variables to your `.env` file in the project root:

```bash
# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

## Variable Descriptions

### VITE_GOOGLE_CLIENT_ID
- **Description**: OAuth 2.0 Client ID from Google Cloud Console
- **Format**: String (e.g., `123456789-abc123def456.apps.googleusercontent.com`)
- **Required**: Yes
- **Source**: Google Cloud Console > APIs & Services > Credentials

### VITE_GOOGLE_CLIENT_SECRET
- **Description**: OAuth 2.0 Client Secret from Google Cloud Console
- **Format**: String (e.g., `GOCSPX-xxxxxxxxxxxxxxxx`)
- **Required**: Yes
- **Source**: Google Cloud Console > APIs & Services > Credentials
- **Security**: Keep this secret! Never commit to version control.

### VITE_GOOGLE_REDIRECT_URI
- **Description**: The URL where Google redirects after OAuth consent
- **Format**: URL string
- **Required**: Yes
- **Default**: `http://localhost:5173/auth/callback`
- **Production**: Update to your production domain (e.g., `https://yourapp.com/auth/callback`)

## Google Cloud Project Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" > "New Project"
3. Name it "LandlordBot"
4. Click "Create"

### Step 2: Enable Google Calendar API
1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Configure OAuth consent screen:
   - User Type: External
   - App name: "LandlordBot"
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "LandlordBot Web Client"
   - Authorized JavaScript origins: `http://localhost:5173` (add production URL later)
   - Authorized redirect URIs: `http://localhost:5173/auth/callback`
5. Click "Create"
6. Copy the Client ID and Client Secret

### Step 4: Configure Environment
1. Create `.env` file in project root if not exists
2. Add the variables with your credentials:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_actual_client_secret
   VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
   ```
3. Restart your development server

## Production Deployment

### Update Redirect URI
When deploying to production:

1. Update `VITE_GOOGLE_REDIRECT_URI` in your production environment:
   ```bash
   VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
   ```

2. Add production redirect URI in Google Cloud Console:
   - Go to "APIs & Services" > "Credentials"
   - Edit your OAuth 2.0 Client ID
   - Add `https://yourdomain.com/auth/callback` to Authorized redirect URIs

### Security Best Practices

1. **Never commit credentials to version control**
   - Add `.env` to `.gitignore`
   - Use environment-specific configuration

2. **Use different credentials for development and production**
   - Create separate OAuth clients for dev/staging/prod

3. **Restrict API access**
   - In Google Cloud Console, restrict the API key to only Google Calendar API
   - Set application restrictions (HTTP referrers)

4. **Monitor API usage**
   - Go to "APIs & Services" > "Dashboard" to monitor usage
   - Set up quotas and alerts

## Rate Limits

Google Calendar API free tier:
- **1 million requests per day** (effectively unlimited for most use cases)
- **Rate limit**: 300 requests per 60 seconds per user

For higher limits, you can request a quota increase in Google Cloud Console.

## Troubleshooting

### "Invalid client" error
- Verify Client ID and Client Secret are correct
- Check that redirect URI matches exactly (including protocol and trailing slashes)

### "Redirect URI mismatch" error
- Ensure the redirect URI in your code matches one registered in Google Cloud Console
- Check for trailing slashes or http vs https

### "Access blocked" error
- Your app may be in testing mode
- Go to OAuth consent screen > Publishing status > Click "Publish App"
- Or add test users in "Test users" section

### Token expiration issues
- The app automatically handles token refresh
- If issues persist, disconnect and reconnect Google Calendar

## Testing

To test the integration:

1. Start the development server: `npm run dev`
2. Navigate to Maintenance or Leases page
3. Click "Connect Google Calendar" button
4. Complete OAuth flow
5. Create a maintenance request or lease
6. Click "Schedule in Calendar" or "Set Renewal Reminder"
7. Verify event appears in Google Calendar

## Support

For issues with Google Calendar API:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Support](https://cloud.google.com/support)
