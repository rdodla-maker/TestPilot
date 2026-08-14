import { describe, it, expect } from 'vitest';
import { isValidUrl, normalizeUrl, getHostname } from '../src/url-validator';

describe('URL Validator', () => {
  describe('isValidUrl', () => {
    it('should validate http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should validate https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('   ')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
      expect(isValidUrl(123 as any)).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should add https to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('should preserve existing protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should throw on empty string', () => {
      expect(() => normalizeUrl('')).toThrow();
    });
  });

  describe('getHostname', () => {
    it('should extract hostname from URL', () => {
      expect(getHostname('https://example.com/path')).toBe('example.com');
      expect(getHostname('https://sub.example.com')).toBe('sub.example.com');
    });

    it('should return empty string for invalid URL', () => {
      expect(getHostname('not a url')).toBe('');
    });
  });
});
