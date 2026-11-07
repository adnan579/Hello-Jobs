import { createHmac } from 'node:crypto';
import { beforeAll, expect, it } from 'vitest';
import { GET, POST } from '../app/api/[...path]/route.ts';
import { createDb } from '../server/db.ts';
import { normalizeIndianPhone } from '../server/lib/phone.ts';

beforeAll(() => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.SESSION_SECRET = 'next-api-route-test-secret-0123456789';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'route-test-webhook-secret';
});

it('serves Express health through the Next route handler', async () => {
  const response = await GET(new Request('http://localhost/api/health') as never);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});

it('preserves the raw webhook body through the Next route adapter', async () => {
  const body = '{ "event" : "ignored" }\n';
  const signature = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest('hex');
  const request = (payload: string) => new Request('http://localhost/api/webhooks/razorpay', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature },
    body: payload,
  });

  const accepted = await POST(request(body) as never);
  expect(accepted.status).toBe(200);
  expect(await accepted.json()).toEqual({ ok: true });

  const changed = await POST(request(body.replace('ignored', 'ignored ')) as never);
  expect(changed.status).toBe(400);
  expect(await changed.json()).toEqual({ error: 'Bad signature' });
});

it('keeps the existing 200 KB JSON request limit', async () => {
  const body = `{"value":"${'x'.repeat(200 * 1024)}"}`;
  const response = await POST(new Request('http://localhost/api/otp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }) as never);
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({ error: 'Request too large.' });
});

it('preserves session cookie attributes through the Next route handler', async () => {
  const db = createDb(process.env.TEST_DATABASE_URL!);
  const phone = `9${String(Date.now()).slice(-9)}`;
  const normalizedPhone = normalizeIndianPhone(phone)!;
  try {
    await db.query("INSERT INTO accounts (phone, role) VALUES ($1, 'worker')", [normalizedPhone]);
    const otpResponse = await POST(new Request('http://localhost/api/otp/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, role: 'worker' }),
    }) as never);
    const otp = await otpResponse.json() as { demoCode: string };
    expect(otpResponse.status).toBe(200);

    const login = await POST(new Request('http://localhost/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, role: 'worker', code: otp.demoCode, mode: 'login' }),
    }) as never);
    const cookie = login.headers.get('set-cookie') ?? '';
    expect(login.status).toBe(200);
    expect(cookie).toContain('hj_session=');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=2592000');
    expect(cookie).not.toContain('Secure');
  } finally {
    await db.close();
  }
});