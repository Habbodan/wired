import type { CookieOptions } from 'express';
import { z } from 'zod';
import type { Sealer } from '../lib/crypto.js';

const TRANSACTION_TTL_MS = 10 * 60 * 1000;
const CONTEXT = 'oauth-transaction';

const transactionSchema = z.object({
  state: z.string().min(32),
  codeVerifier: z.string().min(43).max(128),
  returnTo: z.string(),
  expiresAt: z.number(),
});

export type OAuthTransaction = z.infer<typeof transactionSchema>;

export function transactionCookie(secure: boolean): { name: string; options: CookieOptions } {
  return {
    name: secure ? '__Host-wired_oauth' : 'wired_oauth',
    options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: TRANSACTION_TTL_MS },
  };
}

export function sealTransaction(
  sealer: Sealer,
  transaction: Omit<OAuthTransaction, 'expiresAt'>,
): string {
  const payload: OAuthTransaction = { ...transaction, expiresAt: Date.now() + TRANSACTION_TTL_MS };
  return sealer.seal(JSON.stringify(payload), CONTEXT);
}

export function openTransaction(sealer: Sealer, sealed: unknown): OAuthTransaction | null {
  if (typeof sealed !== 'string' || sealed.length === 0) return null;
  try {
    const transaction = transactionSchema.parse(JSON.parse(sealer.open(sealed, CONTEXT)));
    return transaction.expiresAt > Date.now() ? transaction : null;
  } catch {
    return null;
  }
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 200) return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  if ([...value].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f))
    return '/';
  return value;
}
