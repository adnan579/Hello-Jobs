import type { Config } from '../config.ts';
import type { Queryable } from '../db.ts';
import type { Deps } from '../types.ts';

/** The three moments a worker most wants to hear about on their own phone. */
export type StageAlert = 'shortlisted' | 'interview' | 'offer';

const SUPPORTED_LANGUAGES = new Set(['en', 'hi', 'mr', 'ta', 'gu']);

export interface AlertInput {
  kind: StageAlert;
  jobTitle: string;
  company: string;
}

export type AlertResult = 'sent' | 'skipped' | 'failed';

/**
 * Sends a WhatsApp alert for a stage change, in the language the worker chose.
 *
 * It is a courtesy on top of the in-app notification, so it never throws and never blocks the
 * action that triggered it. It sends only when WhatsApp is configured, an alert template prefix is
 * set, and the worker's latest consent has WhatsApp job alerts switched on and not withdrawn.
 *
 * Each message uses a Meta-approved template named `<prefix>_<kind>` (shortlisted, interview,
 * offer) in the worker's language, with two body parameters: the job title and the company.
 */
export async function sendWorkerStageAlert(
  q: Queryable,
  workerId: string,
  alert: AlertInput,
  config: Config,
  deps: Deps
): Promise<AlertResult> {
  const wa = config.whatsapp;
  if (!wa?.alertTemplatePrefix) return 'skipped';
  try {
    const { rows } = await q.query<{
      phone: string;
      whatsapp_job_alerts: boolean | null;
      is_withdrawn: boolean | null;
      notice_language: string | null;
    }>(
      `SELECT w.phone, c.whatsapp_job_alerts, c.is_withdrawn, c.notice_language
         FROM workers w
         LEFT JOIN LATERAL (
           SELECT whatsapp_job_alerts, is_withdrawn, notice_language FROM consent_records
            WHERE worker_id = w.id ORDER BY created_at DESC LIMIT 1
         ) c ON true
        WHERE w.id = $1`,
      [workerId]
    );
    const row = rows[0];
    if (!row?.whatsapp_job_alerts || row.is_withdrawn) return 'skipped';

    const language = SUPPORTED_LANGUAGES.has(row.notice_language ?? '') ? (row.notice_language as string) : 'en';
    const res = await deps.fetch(`https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${wa.token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: row.phone.replace('+', ''),
        type: 'template',
        template: {
          name: `${wa.alertTemplatePrefix}_${alert.kind}`,
          language: { code: language },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: alert.jobTitle.slice(0, 60) },
                { type: 'text', text: alert.company.slice(0, 60) },
              ],
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // Never log the phone number or the token.
      console.error('[whatsapp-alert] send failed', alert.kind, res.status, body.slice(0, 200));
      return 'failed';
    }
    return 'sent';
  } catch (err) {
    console.error('[whatsapp-alert] error', alert.kind, err instanceof Error ? err.message : 'unknown');
    return 'failed';
  }
}
