import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'not_found'));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'invalid_request',
      issues: error.issues.map(({ path, code }) => ({ path: path.join('.'), code })),
    });
    return;
  }

  if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
    res.status(error.status ?? 400).json({ error: 'invalid_body' });
    return;
  }

  req.log.error({ err: error }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error' });
};
