import crypto from 'node:crypto';

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(9).toString('base64url')}`;
}

export function newToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
