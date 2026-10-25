import type { Config } from '../config.ts';
import type { Deps } from '../types.ts';

/**
 * WhatsApp Business Cloud API "authentication" template with a copy-code button.
 * The payload follows Meta's documented shape for authentication templates (body parameter +
 * url-button parameter carrying the same code). Verify against your approved template in staging.
 */
export async function sendWhatsAppOtp(phone: string, code: string, config: Config, deps: Deps): Promise<void> {
  const wa = config.whatsapp;
  if (!wa) throw new Error('WhatsApp is not configured');
  const url = `https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`;
  const res = await deps.fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${wa.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: {
        name: wa.otpTemplate,
        language: { code: wa.language },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: code }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
        ],
      },
    }),
  });
  if (!res.ok) {
    // Never log the code or the token; the provider's error body is safe and useful.
    const body = await res.text().catch(() => '');
    throw new Error(`WhatsApp send failed (${res.status}): ${body.slice(0, 300)}`);
  }
}
