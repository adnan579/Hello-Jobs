import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServerApp } from './server/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PATH = /^\/admin\/?$/;
const IS_VERCEL = Boolean(process.env.VERCEL);

const app = createServerApp();

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'spa' });
    app.use((req, _res, next) => { if (ADMIN_PATH.test(req.path)) { req.url = '/admin.html'; req.originalUrl = '/admin.html'; } next(); });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(__dirname, 'dist');
    app.get(ADMIN_PATH, (_req, res) => {
      res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
      res.sendFile(path.join(dist, 'admin.html'));
    });
    app.use(express.static(dist, { maxAge: '1h', index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Hello Jobs running on http://localhost:${PORT}`));
}

if (!IS_VERCEL) start();

export default app;
