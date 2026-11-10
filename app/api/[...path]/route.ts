import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import serverless from 'serverless-http';
import { createServerApp } from '../../../server/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  cookies?: string[];
  body?: string;
  isBase64Encoded?: boolean;
}

const expressHandler = serverless(createServerApp());
const JSON_BODY_LIMIT = 200 * 1024;

async function readRawBody(request: NextRequest): Promise<Buffer | null> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() || '';
  const isJson = contentType === 'application/json' || contentType.endsWith('+json');
  const declaredLength = Number(request.headers.get('content-length'));
  if (isJson && Number.isFinite(declaredLength) && declaredLength > JSON_BODY_LIMIT) return null;

  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (isJson && size > JSON_BODY_LIMIT) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size);
}

async function handle(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const rawBody = await readRawBody(request);
  if (!rawBody) {
    return new Response('{"error":"Request too large."}', {
      status: 413,
      headers: { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' },
    });
  }
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const event = {
    version: '2.0',
    routeKey: `${request.method} /api/{proxy+}`,
    rawPath: url.pathname,
    rawQueryString: url.search.slice(1),
    headers: Object.fromEntries(request.headers),
    requestContext: {
      requestId: randomUUID(),
      http: {
        method: request.method,
        path: url.pathname,
        protocol: 'HTTP/1.1',
        sourceIp: forwardedIp || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || '',
      },
    },
    body: rawBody.toString('base64'),
    isBase64Encoded: true,
  };
  const result = await expressHandler(event, {}) as LambdaResponse;
  const headers = new Headers(result.headers);
  for (const cookie of result.cookies ?? []) headers.append('set-cookie', cookie);
  const body = result.isBase64Encoded
    ? Buffer.from(result.body ?? '', 'base64')
    : result.body ?? '';

  return new Response(request.method === 'HEAD' || result.statusCode === 204 || result.statusCode === 304 ? null : body, {
    status: result.statusCode,
    headers,
  });
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;