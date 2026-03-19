import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const CLOUDFLARE_WORKER_URL = Deno.env.get('CLOUDFLARE_WORKER_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    const { message } = await req.json();
    
    if (!message?.text) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text;
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Handle /start with unit code
    if (text.startsWith('/start')) {
      const unitCode = text.split(' ')[1];
      if (unitCode) {
        await supabase.from('telegram_tenants').upsert({
          chat_id: chatId.toString(),
          unit_code: unitCode,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'chat_id' });
        
        await sendTelegramMessage(chatId, 'Welcome! Your unit has been linked. You can now send maintenance requests or ask questions.');
        return new Response('OK', { status: 200 });
      }
    }
    
    // Get tenant info
    const { data: tenant } = await supabase
      .from('telegram_tenants')
      .select('*')
      .eq('chat_id', chatId.toString())
      .single();
    
    if (!tenant) {
      await sendTelegramMessage(chatId, 'Please scan your unit QR code or use /start with your unit code to link your account.');
      return new Response('OK', { status: 200 });
    }
    
    // Call Cloudflare Worker AI
    if (CLOUDFLARE_WORKER_URL) {
      try {
        const aiResponse = await fetch(CLOUDFLARE_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            type: 'tenant-chat',
            context: { totalUnits: 1, occupiedUnits: 1 }
          }),
        }).then(r => r.json());
        
        await sendTelegramMessage(chatId, aiResponse.response || 'Your message has been forwarded to your landlord.');
      } catch (aiError) {
        console.error('AI error:', aiError);
        await sendTelegramMessage(chatId, 'Your message has been forwarded to your landlord.');
      }
    } else {
      await sendTelegramMessage(chatId, 'Your message has been forwarded to your landlord.');
    }
    
    // Log message to database
    await supabase.from('messages').insert({
      tenant_phone: chatId.toString(),
      tenant_message: text,
      landlord_user_id: tenant.landlord_user_id,
      timestamp: new Date().toISOString(),
    });
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return new Response('Error', { status: 500 });
  }
});

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
