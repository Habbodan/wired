import helmet from 'helmet';
import type { RequestHandler } from 'express';
import { HOTEL_ORIGINS } from '../../shared/hotels.js';
import { HttpError } from './errors.js';

const ASSET_ORIGINS = ['https://cdn.habbodan.com'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function securityHeaders(isProduction: boolean): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', ...ASSET_ORIGINS, ...HOTEL_ORIGINS],
        connectSrc: ["'self'", ...HOTEL_ORIGINS],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: isProduction
      ? { maxAge: 63072000, includeSubDomains: true, preload: false }
      : false,
  });
}

export function sameOriginGuard(appOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.get('origin');
    const fetchSite = req.get('sec-fetch-site');
    const trusted = origin ? origin === appOrigin : fetchSite === 'same-origin';

    next(trusted ? undefined : new HttpError(403, 'cross_origin_request'));
  };
}

export const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
