export interface TenantQrCode {
  unitCode: string;
  qrUrl: string;
  botUrl: string;
}

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
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    if (data.ok) {
      return { ok: true, username: data.result.username };
    }
    return { ok: false, error: data.description };
  } catch (e) {
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
