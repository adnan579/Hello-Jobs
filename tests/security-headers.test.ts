import { expect, it } from 'vitest';
import nextConfig from '../next.config.ts';
import { API_SECURITY_HEADERS, HSTS, apiHeaders, isSameOrigin } from '../server/lib/security-headers.ts';

it('next.config repeats the API security headers exactly', async () => {
  const rules = await nextConfig.headers!();
  const api = rules.find((rule) => rule.source === '/api/:path*');
  expect(api).toBeTruthy();
  const configured = Object.fromEntries(api!.headers.map((h) => [h.key, h.value]));
  expect(configured).toMatchObject(API_SECURITY_HEADERS);
});

it('adds HSTS only in production', () => {
  expect(apiHeaders(true)['Strict-Transport-Security']).toBe(HSTS);
  expect(apiHeaders(false)['Strict-Transport-Security']).toBeUndefined();
});

it('accepts only same-site browser writes', () => {
  expect(isSameOrigin(undefined, 'a.example')).toBe(true);
  expect(isSameOrigin('https://a.example', 'a.example', 'https://a.example')).toBe(true);
  expect(isSameOrigin('http://a.example', 'a.example')).toBe(true); // same host counts, as before
  expect(isSameOrigin('https://evil.example', 'a.example', 'https://a.example')).toBe(false);
  expect(isSameOrigin('not a url', 'a.example')).toBe(false);
});
