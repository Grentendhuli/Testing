/**
 * Rate Limiter Module for Cloudflare Worker
 * 
 * Implements per-user and per-IP rate limiting with different tiers for different endpoints.
 * Uses Cloudflare KV for distributed rate limit storage.
 */

// Rate limit configuration by endpoint type
const RATE_LIMITS = {
  // AI endpoints - stricter limits for cost control
  ai: {
    requestsPerWindow: 10,
    windowSizeInSeconds: 60, // 10 requests per minute
    keyPrefix: 'ai'
  },
  // Auth endpoints - strict for brute force protection
  auth: {
    requestsPerWindow: 5,
    windowSizeInSeconds: 300, // 5 attempts per 5 minutes
    keyPrefix: 'auth'
  },
  // Email/Vapi endpoints - moderate
  communication: {
    requestsPerWindow: 20,
    windowSizeInSeconds: 60, // 20 requests per minute
    keyPrefix: 'comm'
  },
  // Export functionality - stricter for resource protection
  export: {
    requestsPerWindow: 5,
    windowSizeInSeconds: 60, // 5 exports per minute
    keyPrefix: 'export'
  },
  // Default/General endpoints
  default: {
    requestsPerWindow: 60,
    windowSizeInSeconds: 60, // 60 requests per minute
    keyPrefix: 'default'
  }
};

// Get rate limit config for a path
function getRateLimitConfig(path) {
  if (path.includes('/ai') || path === '/' || path === '') {
    return RATE_LIMITS.ai;
  }
  if (path.includes('/auth') || path.includes('/login') || path.includes('/forgot')) {
    return RATE_LIMITS.auth;
  }
  if (path.includes('/send-email') || path.includes('/vapi')) {
    return RATE_LIMITS.communication;
  }
  if (path.includes('/export') || path.includes('/download') || path.includes('/report')) {
    return RATE_LIMITS.export;
  }
  return RATE_LIMITS.default;
}

// Generate rate limit key
function generateRateLimitKey(identifier, endpointType) {
  return `${endpointType}:${identifier}`;
}

// Extract user identifier from request (JWT token or IP fallback)
function getUserIdentifier(request, env) {
  // Try to get user ID from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extract user ID from JWT payload (base64 decode middle part)
      const token = authHeader.substring(7);
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        return { type: 'user', id: payload.sub };
      }
    } catch (e) {
      // Invalid JWT, fall through to IP-based
    }
  }
  
  // Fallback to IP-based rate limiting
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                   'unknown';
  return { type: 'ip', id: clientIP };
}

// Check rate limit using in-memory or KV storage
async function checkRateLimit(identifier, config, env) {
  const key = generateRateLimitKey(identifier, config.keyPrefix);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSizeInSeconds;
  
  // Try to use Rate Limiting API if available (Cloudflare Enterprise)
  // Otherwise use KV or in-memory tracking
  
  if (env.RATE_LIMIT_KV) {
    return await checkRateLimitKV(key, now, windowStart, config, env);
  } else {
    // In-memory fallback (stateless - per-request only, not distributed)
    // This is less effective but works without KV
    return checkRateLimitMemory(key, now, config);
  }
}

// KV-based rate limiting (for production with KV namespace)
async function checkRateLimitKV(key, now, windowStart, config, env) {
  try {
    // Get current request log
    const logData = await env.RATE_LIMIT_KV.get(key, { type: 'json' });
    let requests = logData || [];
    
    // Filter to current window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    const currentCount = requests.length;
    const limit = config.requestsPerWindow;
    const remaining = Math.max(0, limit - currentCount);
    const resetTime = requests.length > 0 
      ? Math.min(...requests) + config.windowSizeInSeconds 
      : now + config.windowSizeInSeconds;
    
    // Check if limit exceeded
    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfter: resetTime - now
      };
    }
    
    // Log this request
    requests.push(now);
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(requests), {
      expirationTtl: config.windowSizeInSeconds * 2
    });
    
    return {
      allowed: true,
      limit,
      remaining: remaining - 1,
      resetTime
    };
  } catch (error) {
    console.error('Rate limit KV error:', error);
    // Fail open on KV error
    return {
      allowed: true,
      limit: config.requestsPerWindow,
      remaining: 1,
      resetTime: now + config.windowSizeInSeconds
    };
  }
}

// In-memory rate limiting (for local dev or without KV)
// Note: This is per-request and doesn't persist between requests
function checkRateLimitMemory(key, now, config) {
  // Since Workers are stateless, we can't effectively track in memory
  // This is a minimal fallback that allows requests through
  return {
    allowed: true,
    limit: config.requestsPerWindow,
    remaining: config.requestsPerWindow,
    resetTime: now + config.windowSizeInSeconds
  };
}

// Create rate limit response
function createRateLimitResponse(rateLimitResult, corsOrigin) {
  const retryAfter = rateLimitResult.retryAfter || 60;
  
  return new Response(JSON.stringify({
    success: false,
    error: 'Rate limit exceeded. Please try again later.',
    retryAfter,
    limit: rateLimitResult.limit,
    resetAt: new Date(rateLimitResult.resetTime * 1000).toISOString()
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
      'X-RateLimit-Limit': String(rateLimitResult.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(rateLimitResult.resetTime),
      'Retry-After': String(retryAfter)
    }
  });
}

// Apply rate limit headers to successful response
function applyRateLimitHeaders(response, rateLimitResult) {
  response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, rateLimitResult.remaining)));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));
  return response;
}

// Main rate limiting middleware
export async function rateLimitMiddleware(request, env, corsOrigin, handler) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Get config for this endpoint
  const config = getRateLimitConfig(path);
  
  // Get user identifier
  const identifier = getUserIdentifier(request, env);
  const rateLimitKey = identifier.type === 'user' ? identifier.id : identifier.id;
  
  // Check rate limit
  const rateLimitResult = await checkRateLimit(rateLimitKey, config, env);
  
  if (!rateLimitResult.allowed) {
    console.warn(`[RateLimit] Blocked ${identifier.type}:${rateLimitKey} on ${path}`);
    return createRateLimitResponse(rateLimitResult, corsOrigin);
  }
  
  // Process the request
  const response = await handler(request, env, corsOrigin);
  
  // Add rate limit headers to response
  return applyRateLimitHeaders(response, rateLimitResult);
}

// Simple IP-based rate limiter for specific use cases (no auth required)
export async function checkIPRateLimit(request, env, corsOrigin) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                   'unknown';
  
  const url = new URL(request.url);
  const config = getRateLimitConfig(url.pathname);
  
  return await checkRateLimit(clientIP, config, env);
}

// Export configuration for reference
export { RATE_LIMITS, getRateLimitConfig };
