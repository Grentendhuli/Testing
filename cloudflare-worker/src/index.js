/**
 * LandlordBot Cloudflare Worker
 * Handles AI calls, email sending, and voice calls securely server-side
 * Free tier: 100,000 requests/day
 */

import { Router } from 'itty-router';

const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

// ==========================================
// AI ENDPOINT (Gemini)
// ==========================================
router.post('/ai/chat', async (request, env) => {
  try {
    const { message, type, context } = await request.json();
    
    if (!message) {
      return jsonResponse({ error: 'Message required' }, 400);
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: buildAIPrompt(message, type, context)
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      return jsonResponse({ 
        success: false, 
        response: getFallbackResponse(type) 
      });
    }

    const data = await geminiResponse.json();
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse(type);

    return jsonResponse({ success: true, response });
  } catch (error) {
    console.error('AI error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'AI service error',
      response: getFallbackResponse('default')
    });
  }
});

// ==========================================
// EMAIL ENDPOINT (SendGrid)
// ==========================================
router.post('/email/send', async (request, env) => {
  try {
    const { to, subject, html, text } = await request.json();
    
    if (!to || !subject || (!html && !text)) {
      return jsonResponse({ 
        success: false, 
        error: 'Missing required fields: to, subject, html/text' 
      }, 400);
    }

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
        }],
        from: { email: env.FROM_EMAIL || 'noreply@landlordbot.live' },
        subject: subject,
        content: [
          { type: 'text/plain', value: text || '' },
          { type: 'text/html', value: html || '' },
        ],
      }),
    });

    if (!sendgridResponse.ok) {
      const error = await sendgridResponse.text();
      console.error('SendGrid error:', error);
      return jsonResponse({ 
        success: false, 
        error: 'Failed to send email' 
      }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Email service error' 
    }, 500);
  }
});

// ==========================================
// VAPI VOICE CALL ENDPOINT
// ==========================================
router.post('/vapi/call', async (request, env) => {
  try {
    const { phoneNumber, message } = await request.json();
    
    if (!phoneNumber) {
      return jsonResponse({ 
        success: false, 
        error: 'Phone number required' 
      }, 400);
    }

    const vapiResponse = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: env.VAPI_ASSISTANT_ID,
        phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
        customer: {
          number: phoneNumber,
        },
        assistantOverrides: {
          firstMessage: message || 'Hello, this is your LandlordBot assistant calling.',
        },
      }),
    });

    if (!vapiResponse.ok) {
      const error = await vapiResponse.text();
      console.error('Vapi error:', error);
      return jsonResponse({ 
        success: false, 
        error: 'Failed to initiate call' 
      }, 500);
    }

    const data = await vapiResponse.json();
    return jsonResponse({ 
      success: true, 
      callId: data.id,
      status: data.status 
    });
  } catch (error) {
    console.error('Vapi error:', error);
    return jsonResponse({ 
      success: false, 
      error: 'Voice call service error' 
    }, 500);
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================
router.get('/', () => {
  return jsonResponse({ 
    status: 'ok', 
    service: 'LandlordBot Worker',
    version: '1.0.0'
  });
});

// ==========================================
// MAIN HANDLER
// ==========================================
export default {
  async fetch(request, env, ctx) {
    // Log requests in development
    if (env.ENVIRONMENT !== 'production') {
      console.log(`${request.method} ${request.url}`);
    }
    
    const response = await router.handle(request, env, ctx);
    
    // Add CORS headers to all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  },
};

// ==========================================
// HELPERS
// ==========================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function buildAIPrompt(message, type, context) {
  const baseContext = context ? JSON.stringify(context, null, 2) : '';
  
  const prompts = {
    'tenant-chat': `You are a helpful property management assistant. Answer the landlord's question concisely and professionally.

Context:
${baseContext}

Question: ${message}

Respond in a friendly, helpful tone. Keep responses under 3 sentences unless the question requires detailed explanation.`,

    'maintenance-triage': `Analyze this maintenance request and respond ONLY with a JSON object. No markdown, no backticks, just raw JSON.

Request: "${message}"

Respond with this exact structure:
{
  "priority": "Emergency|Urgent|Standard",
  "trade": "Plumber|Electrician|HVAC|General|Locksmith|Appliance|Pest Control",
  "estimatedCostRange": "$100-$500 range",
  "hpdRisk": true or false,
  "hpdNote": "brief note if HPD risk exists",
  "tenantMessage": "professional acknowledgment message for tenant"
}`,

    'listing-generation': `Generate a compelling rental listing based on this input. Be professional and highlight key selling points.

Input: "${message}"

Requirements:
- Catchy opening line
- Key amenities highlighted
- Neighborhood appeal
- Call to action

Keep to 3-4 short paragraphs.`,

    'default': `${message}`
  };
  
  return prompts[type] || prompts['default'];
}

function getFallbackResponse(type) {
  const fallbacks = {
    'tenant-chat': 'I apologize, but I\'m temporarily unable to process that request. Please try again in a moment.',
    'maintenance-triage': '{"priority": "Standard", "trade": "General", "estimatedCostRange": "$100 - $500", "hpdRisk": false, "tenantMessage": "Thank you for reporting this. We\'ll address it promptly."}',
    'listing-generation': 'Modern rental unit available now! Contact for details and showing.',
    'default': 'Service temporarily unavailable. Please try again.'
  };
  
  return fallbacks[type] || fallbacks['default'];
}
