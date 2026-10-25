export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const badRequest = (m: string, extra?: Record<string, unknown>) => new HttpError(400, m, extra);
export const unauthorized = (m = 'Please sign in to continue.') => new HttpError(401, m);
export const forbidden = (m = 'You do not have permission to do that.') => new HttpError(403, m);
export const notFound = (m = 'Not found.') => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);
export const tooMany = (m = 'Too many requests. Please wait and try again.') => new HttpError(429, m);
