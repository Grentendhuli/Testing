import { rateLimitMiddleware, RATE_LIMITS, getRateLimitConfig, checkRateLimit, checkIPRateLimit, createRateLimitResponse, applyRateLimitHeaders } from './rateLimiter.js';

export default {
  async fetch(request, env) {
    // Allowed origins - restrict to your production domain
    const ALLOWED_ORIGINS = [
      'https://landlord-bot-live.vercel.app',
      'https://landlord-bot.vercel.app',
      'http://localhost:5173', // Development
    ];
    
    const origin = request.headers.get('Origin');
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || !origin;
    const corsOrigin = isAllowedOrigin ? (origin || ALLOWED_ORIGINS[0]) : ALLOWED_ORIGINS[0];

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'POST, GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST' && request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle health check
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        rateLimits: {
          ai: `${RATE_LIMITS.ai.requestsPerWindow}/${RATE_LIMITS.ai.windowSizeInSeconds}s`,
          auth: `${RATE_LIMITS.auth.requestsPerWindow}/${RATE_LIMITS.auth.windowSizeInSeconds}s`,
          communication: `${RATE_LIMITS.communication.requestsPerWindow}/${RATE_LIMITS.communication.windowSizeInSeconds}s`,
          export: `${RATE_LIMITS.export.requestsPerWindow}/${RATE_LIMITS.export.windowSizeInSeconds}s`,
          default: `${RATE_LIMITS.default.requestsPerWindow}/${RATE_LIMITS.default.windowSizeInSeconds}s`,
        }
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Route handlers with rate limiting
    const router = {
      '/send-email': handleEmailSend,
      '/vapi/call': handleVapiCall,
      '/vapi/status': handleVapiStatus,
      '/telegram/validate': handleTelegramValidate,
    };
    
    const handler = router[path] || handleAIChat;
    
    // Apply rate limiting middleware
    return await rateLimitMiddleware(request, env, corsOrigin, handler);
  }
};

// Email sending handler - keeps SendGrid API key server-side
async function handleEmailSend(request, env, corsOrigin) {
  try {
    const { to, subject, html, text, userId } = await request.json().catch(() => ({}));
    
    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: to, subject, html',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email address',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Check if SendGrid is configured
    if (!env.SENDGRID_API_KEY) {
      console.warn('[Worker] SendGrid API key not configured');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Email service not configured'
      }), { 
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Send email via SendGrid API (server-side only)
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { 
          email: env.SENDGRID_FROM_EMAIL || 'noreply@landlordbot.live',
          name: 'LandlordBot'
        },
        subject,
        content: [
          { type: 'text/plain', value: text || html.replace(/<[^>]*>/g, '') },
          { type: 'text/html', value: html },
        ],
      }),
    });
    
    if (response.ok) {
      console.log('[Worker] Email sent successfully:', { to, subject });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Worker] SendGrid API error:', errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to send email'
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
  } catch (error) {
    console.error('[Worker] Email sending error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      }
    });
  }
}

// Vapi call handler - keeps Vapi API key server-side
async function handleVapiCall(request, env, corsOrigin) {
  try {
    const { phoneNumber, userId, sessionType, notes, scheduledAt } = await request.json().catch(() => ({}));
    
    // Validate required fields
    if (!phoneNumber || !userId || !sessionType) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: phoneNumber, userId, sessionType',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return new Response(JSON.stringify({ 
        error: 'Invalid phone number format',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Check if Vapi is configured
    if (!env.VAPI_API_KEY || !env.VAPI_ASSISTANT_ID) {
      console.warn('[Worker] Vapi not configured');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Voice calling service not configured',
        mock: true
      }), { 
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Prepare customer data
    const customerData = {
      userId: userId,
      sessionType: sessionType,
      notes: notes || '',
    };
    
    const body = {
      assistantId: env.VAPI_ASSISTANT_ID,
      name: `Advisor Call - ${sessionType}`,
      customer: {
        number: phoneNumber,
        ...customerData,
      },
      metadata: customerData,
    };
    
    if (env.VAPI_PHONE_NUMBER_ID) {
      body.phoneNumberId = env.VAPI_PHONE_NUMBER_ID;
    }
    
    // Make Vapi API call (server-side only)
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Worker] Vapi call initiated:', { callId: data.id, phoneNumber });
      return new Response(JSON.stringify({ 
        success: true,
        callId: data.id,
        status: data.status,
        data
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Worker] Vapi API error:', errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorData.message || 'Failed to initiate call'
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
  } catch (error) {
    console.error('[Worker] Vapi call error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      }
    });
  }
}

// Vapi status handler
async function handleVapiStatus(request, env, corsOrigin) {
  try {
    const url = new URL(request.url);
    const callId = url.searchParams.get('callId');
    
    if (!callId) {
      return new Response(JSON.stringify({ 
        error: 'Missing callId parameter',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Check if Vapi is configured
    if (!env.VAPI_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Voice calling service not configured'
      }), { 
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Get call status from Vapi API (server-side only)
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${env.VAPI_API_KEY}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return new Response(JSON.stringify({ 
        success: true,
        status: data.status,
        data
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorData.message || 'Failed to get call status'
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
  } catch (error) {
    console.error('[Worker] Vapi status error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      }
    });
  }
}

// Telegram bot token validation handler
async function handleTelegramValidate(request, env, corsOrigin) {
  try {
    const { token } = await request.json().catch(() => ({}));
    
    // Validate required fields
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: token',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Basic token format validation (should be like "123456:ABC-DEF...")
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    if (!tokenRegex.test(token)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid token format'
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Validate token with Telegram API (server-side only)
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      return new Response(JSON.stringify({ 
        success: true,
        username: data.result.username,
        botInfo: data.result
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false,
        error: data.description || 'Invalid bot token'
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
  } catch (error) {
    console.error('[Worker] Telegram validation error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to validate token'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      }
    });
  }
}

// AI Chat handler
async function handleAIChat(request, env, corsOrigin) {
    const { message, context, type, userId } = await request.json().catch(() => ({}));
    
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Invalid request: message required',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Server-side prompt injection detection
    const injectionPatterns = [
      /ignore\s+(previous|all)\s+instructions?/i,
      /system\s+prompt/i,
      /you\s+are\s+now/i,
      /disregard\s+(previous|all)/i,
      /forget\s+(everything|all|your)/i,
      /new\s+role\s*:/i,
      /act\s+as\s+/i,
      /pretend\s+to\s+be/i,
      /\[system\s*\]/i,
      /\<system\s*\>/i,
    ];
    
    const hasInjection = injectionPatterns.some(pattern => pattern.test(message));
    if (hasInjection) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input: Potentially harmful content detected',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    // Input length validation
    if (message.length > 4000) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input: Message too long (max 4000 characters)',
        success: false 
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    let systemPrompt = '';
    if (type === 'tenant-chat') {
      systemPrompt = `You are LandlordBot, a helpful NYC property management AI assistant.
Communicate warmly but professionally with tenants.
You can:
- Answer questions about lease terms, policies, payments
- Acknowledge maintenance requests and reassure tenants
- Provide general property information
- Escalate urgent issues appropriately

Portfolio: ${context?.totalUnits || 0} units, ${context?.occupiedUnits || 0} occupied.
Respond in 1-3 sentences, friendly but professional.`;
    } else if (type === 'maintenance-triage') {
      systemPrompt = `Analyze this maintenance request. Respond ONLY in valid JSON format:
{
  "priority": "Emergency|Urgent|Standard",
  "trade": "Plumbing|Electrical|HVAC|Appliance|General",
  "estimatedCostRange": "$100-$500",
  "hpdRisk": boolean,
  "hpdNote": "Brief note about HPD violation risk if applicable",
  "tenantMessage": "Professional message acknowledging the issue to send to tenant"
}

Be accurate about NYC housing standards.`;
    } else if (type === 'payment-reminder') {
      systemPrompt = `You are drafting a payment reminder message for a tenant.
Consider the tenant's payment history and relationship.
Be polite but clear about the payment expectation.
Keep it under 400 characters.

Tenant context: ${JSON.stringify(context || {})}`;
    } else if (type === 'lead-response') {
      systemPrompt = `You are drafting a response to a rental inquiry from a potential tenant.
Be warm, welcoming, and professional.
Mention available units that match their preferences.
Offer viewing times.
Keep it under 400 characters.

Lead context: ${JSON.stringify(context || {})}`;
    } else if (type === 'cost-estimate') {
      systemPrompt = `You are analyzing a maintenance request to provide a cost estimate.
Consider NYC/Long Island market rates.
Provide a realistic range including materials and labor.

Request context: ${JSON.stringify(context || {})}`;
    }

    try {
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      });

      return new Response(JSON.stringify({ 
        response: response.response,
        success: true 
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        success: false 
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
  }
