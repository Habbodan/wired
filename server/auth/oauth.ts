import { z } from 'zod';
import type { Config } from '../config.js';
import { HttpError } from '../http/errors.js';

const REQUEST_TIMEOUT_MS = 8000;

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().regex(/^bearer$/i),
});

const userinfoSchema = z.object({
  sub: z.string().regex(/^\d+$/),
  username: z.string().min(1).max(64),
  hotel: z.string().min(1).max(16),
});

export interface HabbodanProfile {
  habbodanId: number;
  username: string;
  hotel: string;
}

export interface OAuthClient {
  authorizationUrl(params: { state: string; codeChallenge: string }): string;
  exchangeCode(params: { code: string; codeVerifier: string }): Promise<HabbodanProfile>;
}

export function createOAuthClient(
  settings: Config['oauth'],
  fetchImpl: typeof fetch = fetch,
): OAuthClient {
  const basicAuth = Buffer.from(
    `${encodeURIComponent(settings.clientId)}:${encodeURIComponent(settings.clientSecret)}`,
  ).toString('base64');

  async function requestJson(url: string, init: RequestInit): Promise<unknown> {
    const response = await fetchImpl(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new HttpError(502, 'identity_provider_rejected');
    return response.json();
  }

  return {
    authorizationUrl({ state, codeChallenge }) {
      const url = new URL(settings.authorizeUrl);
      url.search = new URLSearchParams({
        response_type: 'code',
        client_id: settings.clientId,
        redirect_uri: settings.redirectUri,
        scope: 'profile',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }).toString();
      return url.toString();
    },

    async exchangeCode({ code, codeVerifier }) {
      const token = tokenResponseSchema.parse(
        await requestJson(settings.tokenUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: settings.redirectUri,
            code_verifier: codeVerifier,
          }),
        }),
      );

      const profile = userinfoSchema.parse(
        await requestJson(settings.userinfoUrl, {
          headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
        }),
      );

      return { habbodanId: Number(profile.sub), username: profile.username, hotel: profile.hotel };
    },
  };
}
