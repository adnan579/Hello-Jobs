// Smoke test for a deployed (or locally started production) site. It needs no login and changes nothing.
//   node scripts/preview-check.mjs https://your-preview-url.vercel.app
//   npm run preview:check -- http://localhost:3000
// Exit code 1 if any check fails, so it can also gate a deploy step.
const base = (process.argv[2] ?? process.env.PREVIEW_URL ?? '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: node scripts/preview-check.mjs <site url>');
  process.exit(2);
}
const isHttps = base.startsWith('https://');
let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `  (${detail})`}`);
  if (!ok) failed += 1;
};
const get = (path, init) => fetch(base + path, { redirect: 'manual', ...init });

// --- Health: database reachable, migrations applied
const health = await get('/api/health');
const healthBody = await health.json().catch(() => ({}));
check('GET /api/health is 200 {ok:true}', health.status === 200 && healthBody.ok === true, JSON.stringify(healthBody));

// --- API headers (native and Express-served routes)
for (const path of ['/api/health', '/api/bootstrap', '/api/auth/me']) {
  const r = await get(path);
  check(`${path} sends nosniff + load-nothing CSP`, r.headers.get('x-content-type-options') === 'nosniff' && /default-src 'none'/.test(r.headers.get('content-security-policy') ?? ''), `status ${r.status}`);
}
const bootstrapRes = await get('/api/bootstrap');
check('/api/bootstrap is never cached', /no-store/.test(bootstrapRes.headers.get('cache-control') ?? ''));
const bootstrap = await bootstrapRes.json().catch(() => ({}));
check('visitor bootstrap has no session', !bootstrap.session);
const text = JSON.stringify(bootstrap);
check('visitor bootstrap exposes no HR contact fields', !/hrContactPhone|whatsappApplyNumber|hrContactName/.test(text));

// --- Cross-site writes are refused
const cross = await get('/api/jobs', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' });
check('cross-site POST /api/jobs is blocked (403)', cross.status === 403, `status ${cross.status}`);

// --- Pages
const home = await get('/');
const html = await home.text();
check('GET / is 200 HTML', home.status === 200 && /<html/i.test(html), `status ${home.status}`);
if (isHttps) check('HSTS is sent', /max-age=\d+/.test(home.headers.get('strict-transport-security') ?? ''));
const csp = home.headers.get('content-security-policy') ?? '';
const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
if (isHttps || csp) {
  check('page CSP has a nonce and no unsafe-inline scripts', Boolean(nonce) && !/script-src[^;]*unsafe-inline/.test(csp), csp.slice(0, 120));
  if (nonce) {
    const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].map((m) => m[0]);
    const bare = inline.filter((tag) => !tag.includes(`nonce="${nonce}"`));
    check(`all ${inline.length} inline scripts carry the nonce`, bare.length === 0, `${bare.length} without`);
  }
  check('no third-party font hosts in the policy or the page', !/googleapis|gstatic/.test(csp + html));
  check('frames are refused (frame-ancestors none)', /frame-ancestors 'none'/.test(csp));
}

// Every page type has to pass the nonce check: a prerendered page would ship inline scripts the browser blocks.
for (const path of ['/jobs', '/employers', '/admin']) {
  const r = await get(path);
  const pageCsp = r.headers.get('content-security-policy') ?? '';
  const pageNonce = /'nonce-([^']+)'/.exec(pageCsp)?.[1];
  if (!pageNonce) continue; // development servers send no strict policy
  const inline = [...(await r.text()).matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].map((m) => m[0]);
  const bare = inline.filter((tag) => !tag.includes(`nonce="${pageNonce}"`));
  check(`${path}: all ${inline.length} inline scripts carry the nonce`, bare.length === 0, `${bare.length} without, so the browser would block them`);
}

const about = await get('/about');
const aboutHtml = await about.text();
check('GET /about is 200', about.status === 200, `status ${about.status}`);
// The public grievance/helpline details are inlined at build time. CI builds with known values and lists them here
// (EXPECT_CONTACT=a,b) so a build that silently drops them fails.
for (const expected of (process.env.EXPECT_CONTACT ?? '').split(',').filter(Boolean)) {
  check(`footer shows the configured contact detail "${expected}"`, aboutHtml.includes(expected));
}
const jobs = await get('/jobs');
check('GET /jobs is 200', jobs.status === 200, `status ${jobs.status}`);
const employers = await get('/employers');
check('GET /employers is 200', employers.status === 200, `status ${employers.status}`);

// --- A real public job page, if any job exists
const first = bootstrap.jobs?.[0];
if (first) {
  const page = await get(`/jobs/${encodeURIComponent(first.id)}`);
  const body = await page.text();
  check(`GET /jobs/${first.id} is 200`, page.status === 200, `status ${page.status}`);
  check('job page has JobPosting structured data', /"@type":\s*"JobPosting"/.test(body));
  check('job page shows no HR phone or WhatsApp number', !/hrContactPhone|whatsappApplyNumber/.test(body));
} else {
  console.log('SKIP  no public jobs yet, job page checks skipped');
}
const missing = await get('/jobs/job-does-not-exist');
check('unknown job id is 404', missing.status === 404, `status ${missing.status}`);

// --- Discovery files
const sitemap = await get('/sitemap.xml');
check('GET /sitemap.xml is XML with the home page', sitemap.status === 200 && /<urlset/.test(await sitemap.text()), `status ${sitemap.status}`);
const robots = await get('/robots.txt');
const robotsText = await robots.text();
check('GET /robots.txt hides /admin', robots.status === 200 && /Disallow:\s*\/admin/.test(robotsText));

// --- Staff console
const admin = await get('/admin');
check('GET /admin is 200', admin.status === 200, `status ${admin.status}`);
check('/admin is noindex and no-store', /noindex/.test(admin.headers.get('x-robots-tag') ?? '') && /no-store/.test(admin.headers.get('cache-control') ?? ''));
const legacy = await get('/admin.html');
check('/admin.html redirects to /admin', [307, 308].includes(legacy.status) && /\/admin$/.test(legacy.headers.get('location') ?? ''), `status ${legacy.status}`);

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
