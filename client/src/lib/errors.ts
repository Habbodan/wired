import type { TFunction } from 'i18next';
import { MissingKeyError, WiredApiError } from './wired/client';
import { RateLimitedError } from './wired/rateLimiter';

const WIRED_ERROR_CODES: Record<
  string,
  | 'errors.key_invalid'
  | 'errors.variable_not_found'
  | 'errors.entity_not_found'
  | 'errors.room_not_found'
> = {
  'wired.variables.key_invalid': 'errors.key_invalid',
  'wired.variables.not_found': 'errors.variable_not_found',
  'wired.variables.entity_not_found': 'errors.entity_not_found',
  'not-found': 'errors.room_not_found',
};

export function describeError(error: unknown, t: TFunction): string {
  if (error instanceof RateLimitedError) {
    return t('errors.local_rate_limited', { seconds: Math.ceil(error.retryAfterMs / 1000) });
  }
  if (error instanceof MissingKeyError) {
    return error.key === 'read' ? t('errors.missing_read_key') : t('errors.missing_write_key');
  }
  if (error instanceof WiredApiError) {
    const known = WIRED_ERROR_CODES[error.code];
    if (known) return t(known);
    if (error.status === 403) return t('errors.forbidden');
    if (error.status === 404) return t('errors.not_found');
    if (error.status === 429) return t('errors.rate_limited');
    if (error.status === 400) return t('errors.bad_request');
    return t('errors.generic');
  }
  if (
    error instanceof TypeError ||
    (error instanceof DOMException && error.name === 'TimeoutError')
  ) {
    return t('errors.network');
  }
  return t('errors.generic');
}
