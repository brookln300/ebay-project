/**
 * Prepends the basePath to API URLs.
 * Next.js basePath is NOT auto-prepended to fetch() calls —
 * only <Link> and router. This must be used for all client-side API calls.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function api(path: string): string {
  // Already prefixed or external URL
  if (path.startsWith(BASE_PATH) || path.startsWith('http')) return path;
  return `${BASE_PATH}${path}`;
}
