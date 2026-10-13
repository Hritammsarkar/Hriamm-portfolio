/** Server-only request limits. Do not import this module into client components. */
const initialized = new WeakMap<D1Database, Promise<unknown>>();

export class RequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function apiError(message: string, status: number, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return Response.json({error: message}, {status, headers});
}

/** Enforce the real streamed byte size, even without a Content-Length header. */
export async function readBoundedBody(req: Request, maximumBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = req.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) {
    throw new RequestError(400, 'Invalid content length.');
  }
  if (declared !== null && Number(declared) > maximumBytes) {
    throw new RequestError(413, 'Request body is too large.');
  }
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel().catch(() => {});
        throw new RequestError(413, 'Request body is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/** One atomic counter per owner operation, shared by all Worker instances. */
export async function enforceRateLimit(db: D1Database, scope: 'content-write' | 'file-upload', maximum: number, windowSeconds = 60, now = Date.now()): Promise<Response | null> {
  let ready = initialized.get(db);
  if (!ready) {
    ready = db.prepare('CREATE TABLE IF NOT EXISTS api_rate_limits (scope TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL)').run();
    initialized.set(db, ready);
  }
  try {
    await ready;
  } catch (error) {
    initialized.delete(db);
    throw error;
  }
  const row = await db.prepare(`
    INSERT INTO api_rate_limits (scope, attempts, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(scope) DO UPDATE SET
      attempts = CASE WHEN api_rate_limits.reset_at <= ? THEN 1 ELSE MIN(api_rate_limits.attempts + 1, ?) END,
      reset_at = CASE WHEN api_rate_limits.reset_at <= ? THEN excluded.reset_at ELSE api_rate_limits.reset_at END
    RETURNING attempts, reset_at
  `).bind(scope, now + windowSeconds * 1000, now, maximum + 1, now).first<{attempts: number; reset_at: number}>();
  if (!row) throw new Error('Rate limit storage unavailable');
  if (row.attempts <= maximum) return null;
  const retryAfter = Math.max(1, Math.ceil((row.reset_at - now) / 1000));
  return apiError('Too many requests. Wait a minute before trying again.', 429, {'Retry-After': String(retryAfter)});
}

export const uploadedFileKey = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.(pdf|png|jpg)$/;

export function allowedFileType(bytes: Uint8Array): {extension: string; contentType: string} | null {
  if (bytes.length >= 8 && bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45) {
    return {extension: 'pdf', contentType: 'application/pdf'};
  }
  if (bytes.length >= 33 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10 && bytes[12] === 73 && bytes[13] === 72 && bytes[14] === 68 && bytes[15] === 82) {
    return {extension: 'png', contentType: 'image/png'};
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return {extension: 'jpg', contentType: 'image/jpeg'};
  }
  return null;
}
