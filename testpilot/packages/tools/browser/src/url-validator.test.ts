import { describe, expect, it } from 'vitest';
import { isSafeTargetUrl } from './url-validator';

describe('safe target URL policy', () => {
  it('allows public HTTP(S) targets and blocks internal targets by default', () => {
    expect(isSafeTargetUrl('https://example.com')).toBe(true);
    expect(isSafeTargetUrl('http://localhost:3000')).toBe(false);
    expect(isSafeTargetUrl('http://127.0.0.1')).toBe(false);
    expect(isSafeTargetUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafeTargetUrl('http://192.168.1.10')).toBe(false);
  });

  it('requires explicit local-target opt-in and rejects credentials', () => {
    expect(isSafeTargetUrl('http://localhost:3000', true)).toBe(true);
    expect(isSafeTargetUrl('file:///tmp/page.html', true)).toBe(true);
    expect(isSafeTargetUrl('https://user:password@example.com')).toBe(false);
  });
});