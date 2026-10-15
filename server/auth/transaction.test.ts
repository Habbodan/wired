import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './transaction.js';

describe('safeReturnTo', () => {
  it.each([
    ['/workspaces', '/workspaces'],
    ['/w/abc?tab=explorer', '/w/abc?tab=explorer'],
    ['https://evil.test', '/'],
    ['//evil.test', '/'],
    ['/\\evil.test', '/'],
    ['javascript:alert(1)', '/'],
    ['/ok\nSet-Cookie: x', '/'],
    [undefined, '/'],
    [['/a', '/b'], '/'],
  ])('maps %j to %j', (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});
