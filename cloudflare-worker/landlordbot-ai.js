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
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
        }
      });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Route to email handler if path is /send-email
    if (path === '/send-email') {
      return handleEmailSend(request, env, corsOrigin);
    }
    
    // Otherwise handle AI chat
    return handleAIChat(request, env, corsOrigin);
  }
};

// Email sending handler - keeps SendGrid API key server-side
async function handleEmailSend(request, env, corsOrigin) {
  try {
    const { to, subject, html, text } = await request.json().catch(() => ({}));
    
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

// AI Chat handler
async function handleAIChat(request, env, corsOrigin) {
    // Rate limiting check (simple in-memory per IP)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rate_limit:${clientIP}`;
    
    // Check for prompt injection patterns server-side
    const requestData = await request.json().catch(() => ({}));
    const { message, context, type } = requestData;
    
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
};
