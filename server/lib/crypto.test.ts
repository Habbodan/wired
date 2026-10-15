import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createSealer, safeEqual } from './crypto.js';

describe('createSealer', () => {
  const sealer = createSealer(randomBytes(32));

  it('round-trips a value bound to its context', () => {
    const sealed = sealer.seal('secret-key', 'workspace:a');
    expect(sealed).not.toContain('secret-key');
    expect(sealer.open(sealed, 'workspace:a')).toBe('secret-key');
  });

  it('produces a different ciphertext every time', () => {
    expect(sealer.seal('same', 'ctx')).not.toBe(sealer.seal('same', 'ctx'));
  });

  it('rejects a value opened under another context', () => {
    const sealed = sealer.seal('secret-key', 'workspace:a');
    expect(() => sealer.open(sealed, 'workspace:b')).toThrow();
  });

  it('rejects tampered ciphertext', () => {
    const parts = sealer.seal('secret-key', 'ctx').split('.');
    parts[3] = Buffer.from('tampered').toString('base64url');
    expect(() => sealer.open(parts.join('.'), 'ctx')).toThrow();
  });

  it('rejects a value sealed with another key', () => {
    const other = createSealer(randomBytes(32));
    expect(() => sealer.open(other.seal('x', 'ctx'), 'ctx')).toThrow();
  });
});

describe('safeEqual', () => {
  it('compares strings of different lengths without throwing', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('abc', 'abc')).toBe(true);
  });
});
