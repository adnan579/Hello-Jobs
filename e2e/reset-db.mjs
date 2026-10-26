// Starts every e2e run from an empty database (the app creates the schema and the admin on boot).
import pg from 'pg';

const url = process.env.DATABASE_URL;
const name = url.split('/').pop();
const admin = new pg.Client({ connectionString: url.replace(/\/[^/]+$/, '/postgres') });
await admin.connect();
await admin.query(`CREATE DATABASE "${name}"`).catch(() => undefined);
await admin.end();
const c = new pg.Client({ connectionString: url });
await c.connect();
await c.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
await c.end();
