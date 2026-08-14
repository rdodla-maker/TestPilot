/**
 * URL validation utilities
 */

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(urlString: string): boolean {
  if (typeof urlString !== 'string' || !urlString.trim()) {
    return false;
  }

  try {
    const url = new URL(urlString);
    // Allow http, https, file (local fixtures), and data URLs used by diagnostics
    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:' ||
      url.protocol === 'file:' ||
      url.protocol === 'data:'
    );
  } catch {
    return false;
  }
}

/**
 * Normalize URL by ensuring protocol is present
 */
export function normalizeUrl(urlString: string): string {
  if (!urlString.trim()) {
    throw new Error('URL cannot be empty');
  }

  const trimmed = urlString.trim();

  // If no protocol, add https
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Extract hostname from URL
 */
export function getHostname(urlString: string): string {
  try {
    return new URL(urlString).hostname;
  } catch {
    return '';
  }
}
