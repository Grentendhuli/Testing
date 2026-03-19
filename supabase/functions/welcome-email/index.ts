// Follow this setup guide to integrate the Deno language server:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, firstName } = await req.json() as WelcomeEmailRequest;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      // Still return success so user experience isn't broken
      return new Response(
        JSON.stringify({ success: true, warning: 'Email not sent - API key not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'concierge@landlordbot.app',
        to: email,
        subject: "Welcome to LandlordBot — here's what to do first",
        text: `Hi ${firstName || 'there'},

Welcome to LandlordBot.

I'm the NYC Pro Advisor — I built this because I manage large-scale NYC tenants and couldn't find a tool that actually understood NYC compliance law.

Your next step: Add your first property → https://landlord-bot.vercel.app/units

If you have any questions, reply to this email any time. I read every one.

— the NYC Pro Advisor`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LandlordBot</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="width: 60px; height: 60px; background: #1E3A5F; border-radius: 12px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 24px;">🏢</span>
    </div>
  </div>
  
  <p style="font-size: 16px;">Hi ${firstName || 'there'},</p>
  
  <p style="font-size: 16px;">Welcome to LandlordBot.</p>
  
  <p style="font-size: 16px;">
    I'm <strong>the NYC Pro Advisor</strong> — I built this because I manage large-scale NYC tenants and couldn't find a tool that actually understood NYC compliance law.
  </p>
  
  <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">Your next step:</p>
    <a href="https://landlord-bot.vercel.app/units" 
       style="display: inline-block; background: #1E3A5F; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Add Your First Property →
    </a>
  </div>
  
  <p style="font-size: 16px; color: #6b7280;">
    If you have any questions, reply to this email any time. <strong>I read every one.</strong>
  </p>
  
  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #9ca3af;">
    — the NYC Pro Advisor<br>
    <a href="https://landlord-bot.vercel.app" style="color: #6b7280;">landlord-bot.vercel.app</a>
  </p>
</body>
</html>`,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    
    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
