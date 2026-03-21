export interface TenantQrCode {
  unitCode: string;
  qrUrl: string;
  botUrl: string;
}

const WORKER_URL = (import.meta as any).env?.VITE_CLOUDFLARE_WORKER_URL || '';

export function buildUnitCode(unitId: string, landlordId: string): string {
  // Create a short, memorable code like "LB-3X9Z-A1"
  const shortLandlord = landlordId.slice(-4).toUpperCase();
  const shortUnit = unitId.slice(-4).toUpperCase();
  return `LB-${shortLandlord}-${shortUnit}`;
}

export function getTenantQrCodeUrl(unitCode: string, botUsername: string): string {
  // Generate QR code URL for tenant to scan
  const startParam = encodeURIComponent(`unit_${unitCode}`);
  return `https://t.me/${botUsername}?start=${startParam}`;
}

export async function validateBotToken(token: string): Promise<{ ok: boolean; username?: string; error?: string }> {
  // Validate token server-side via Cloudflare Worker
  if (!WORKER_URL) {
    return { ok: false, error: 'Cloudflare Worker not configured' };
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/telegram/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return { ok: true, username: data.username };
    }
    
    return { ok: false, error: data.error || 'Token validation failed' };
  } catch (e) {
    console.error('Error validating Telegram token:', e);
    return { ok: false, error: 'Network error validating token' };
  }
}

export async function registerWebhook(
  token: string,
  webhookUrl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const data = await response.json();
    return { ok: data.ok, error: data.description };
  } catch (e) {
    return { ok: false, error: 'Failed to register webhook' };
  }
}

export const BOTFATHER_STEPS = `
1. Message @BotFather on Telegram
2. Send /newbot
3. Choose a name (e.g., "YourName Properties")
4. Choose a username ending in 'bot' (e.g., yourname_properties_bot)
5. Copy the HTTP API token provided
6. Paste it in LandlordBot → Config → Bot Settings
`;
