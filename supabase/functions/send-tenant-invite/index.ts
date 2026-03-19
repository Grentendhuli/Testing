// DEPLOY: supabase functions deploy send-tenant-invite
// ENV: RESEND_API_KEY, RESEND_FROM_EMAIL

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { toEmail, toName, unitNumber, propertyAddress, inviteLink, botUsername, fromName } = await req.json();

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteLink)}&color=1E3A5F`;

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px">
      <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#1E3A5F;padding:24px;text-align:center">
          <p style="color:#94a3b8;font-size:13px;margin:0">${propertyAddress}</p>
          <p style="color:white;font-size:22px;font-weight:bold;margin:4px 0">Unit ${unitNumber}</p>
        </div>
        <div style="padding:28px">
          <p style="color:#1e293b;font-size:15px">Hi ${toName},</p>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Your landlord <strong>${fromName}</strong> has set up a direct messaging system for your building.
            You can now contact them for maintenance, rent, or anything else — right from your phone.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${inviteLink}" style="background:#F59E0B;color:#1e293b;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Connect to Building Bot →
            </a>
          </div>
          <div style="text-align:center;margin:20px 0">
            <img src="${qrUrl}" width="180" height="180" alt="QR Code" style="border-radius:12px;border:1px solid #e2e8f0" />
            <p style="color:#94a3b8;font-size:12px;margin-top:8px">Or scan this QR code with your camera</p>
          </div>
          <div style="background:#f8fafc;border-radius:8px;padding:16px">
            <p style="color:#475569;font-size:13px;margin:0 0 8px 0;font-weight:bold">3 easy steps:</p>
            <p style="color:#64748b;font-size:13px;margin:4px 0">1. Tap the button above (or scan the QR code)</p>
            <p style="color:#64748b;font-size:13px;margin:4px 0">2. Telegram opens — tap Start</p>
            <p style="color:#64748b;font-size:13px;margin:4px 0">3. Send your first message</p>
          </div>
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px;margin:0">Powered by LandlordBot · Your messages are private and secure</p>
        </div>
      </div>
    </body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@landlordbot.app',
        to: toEmail,
        subject: `Connect to your building bot — Unit ${unitNumber}`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: data.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
