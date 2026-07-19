/**
 * Transactional email via Resend. Reads RESEND_API_KEY from the environment.
 *
 * If no key is configured (e.g. local preview), sending is a graceful no-op
 * that returns false — the caller still logs the "would-have-sent" notification
 * so the flow is fully exercisable without a provider.
 */
export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.EMAIL_FROM || "Steady <steady@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, html: email.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function emailLayout(innerHtml: string, preheader: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Steady</title></head>
  <body style="margin:0;background:#f4f1ea;font-family:Inter,Helvetica,Arial,sans-serif;color:#2b2a25;">
  <div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border-radius:20px;overflow:hidden;border:1px solid #e6e0d3;">
        <tr><td style="padding:28px 32px 8px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#9b978c;">Steady</td></tr>
        <tr><td style="padding:0 32px 32px;">${innerHtml}</td></tr>
        <tr><td style="padding:0 32px 28px;font-size:12px;color:#9b978c;line-height:1.5;">
          You're getting this because daily reminders are on. Reply any time — or adjust it in Settings.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
