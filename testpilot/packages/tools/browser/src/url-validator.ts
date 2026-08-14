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

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [first, second] = octets;
  return first === 10 || first === 127 || first === 0 || (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

export function isSafeTargetUrl(urlString: string, allowLocalTargets = false): boolean {
  if (typeof urlString !== 'string' || urlString.length > 2048 || !isValidUrl(urlString)) return false;
  let url: URL;
  try { url = new URL(urlString); } catch { return false; }
  if (url.username || url.password) return false;
  if (url.protocol === 'file:' || url.protocol === 'data:') return allowLocalTargets;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (allowLocalTargets) return true;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  return hostname !== 'localhost' && hostname !== 'metadata.google.internal' &&
    hostname !== 'instance-data.ec2.internal' && !isPrivateIpv4(hostname) &&
    hostname !== '::1' && !hostname.startsWith('fc') && !hostname.startsWith('fd') && !hostname.startsWith('fe80:');
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
