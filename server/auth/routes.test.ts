import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { APP_ORIGIN, testApp } from '../test/support.js';
import type { OAuthClient } from './oauth.js';

function fakeOAuth(): OAuthClient {
  return {
    authorizationUrl: ({ state, codeChallenge }) =>
      `https://id.test/oauth/authorize?state=${state}&code_challenge=${codeChallenge}`,
    exchangeCode: vi.fn(async () => ({ habbodanId: 7, username: 'Frank', hotel: 'tr' })),
  };
}

function fakePrisma() {
  return {
    user: { upsert: vi.fn(async () => ({ id: 'user-1' })) },
    session: { create: vi.fn(async () => ({})), deleteMany: vi.fn(async () => ({ count: 0 })) },
  } as unknown as PrismaClient;
}

async function startLogin(app: ReturnType<typeof testApp>, returnTo = '/workspaces') {
  const response = await request(app).get('/auth/login').query({ returnTo });
  const location = new URL(response.headers.location as string);
  const cookie = (response.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;
  return { response, location, cookie, state: location.searchParams.get('state')! };
}

describe('auth routes', () => {
  it('redirects to the provider with state and a PKCE challenge', async () => {
    const { response, location, state } = await startLogin(testApp({ oauth: fakeOAuth() }));

    expect(response.status).toBe(302);
    expect(location.origin).toBe('https://id.test');
    expect(state.length).toBeGreaterThanOrEqual(43);
    expect(location.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.headers['set-cookie']![0]).toMatch(
      /__Host-wired_oauth=.*HttpOnly.*Secure.*SameSite=Lax/i,
    );
  });

  it('rejects a callback whose state does not match', async () => {
    const oauth = fakeOAuth();
    const app = testApp({ oauth, prisma: fakePrisma() });
    const { cookie } = await startLogin(app);

    const response = await request(app)
      .get('/auth/callback')
      .query({ code: 'abc', state: 'forged-state-forged-state-forged-state-1234' })
      .set('Cookie', cookie);

    expect(response.headers.location).toBe('/?login=failed');
    expect(oauth.exchangeCode).not.toHaveBeenCalled();
  });

  it('rejects a callback without the transaction cookie', async () => {
    const oauth = fakeOAuth();
    const app = testApp({ oauth });
    const { state } = await startLogin(app);

    const response = await request(app).get('/auth/callback').query({ code: 'abc', state });

    expect(response.headers.location).toBe('/?login=failed');
    expect(oauth.exchangeCode).not.toHaveBeenCalled();
  });

  it('creates a session and returns to the requested page', async () => {
    const oauth = fakeOAuth();
    const prisma = fakePrisma();
    const app = testApp({ oauth, prisma });
    const { cookie, state, location } = await startLogin(app, '/w/123');

    const response = await request(app)
      .get('/auth/callback')
      .query({ code: 'the-code', state })
      .set('Cookie', cookie);

    expect(response.headers.location).toBe('/w/123');
    const verifier = vi.mocked(oauth.exchangeCode).mock.calls[0]![0].codeVerifier;
    expect(createHash('sha256').update(verifier).digest('base64url')).toBe(
      location.searchParams.get('code_challenge'),
    );
    const sessionCookie = (response.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('__Host-wired_session='),
    );
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/Secure/i);
    expect(prisma.session.create).toHaveBeenCalledOnce();
  });

  it('refuses logout from another origin', async () => {
    const response = await request(testApp())
      .post('/auth/logout')
      .set('Origin', 'https://evil.test');

    expect(response.status).toBe(403);
  });
});

describe('api guards', () => {
  it('reports no user without a session cookie', async () => {
    const response = await request(testApp()).get('/api/me');
    expect(response.body).toEqual({ user: null });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('requires a session for workspaces', async () => {
    const response = await request(testApp()).get('/api/workspaces');
    expect(response.status).toBe(401);
  });

  it('blocks cross-origin writes before touching the session', async () => {
    const response = await request(testApp())
      .put('/api/workspaces/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
      .set('Origin', 'https://evil.test')
      .send({});
    expect(response.status).toBe(403);
  });

  it('allows same-origin writes through to authentication', async () => {
    const response = await request(testApp())
      .put('/api/workspaces/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
      .set('Origin', APP_ORIGIN)
      .send({});
    expect(response.status).toBe(401);
  });
});
