const BLOCKED_SCHEME = /^\s*(javascript|vbscript|file):/i;
const KNOWN_SCHEME = /^(https?:\/\/|mailto:)/i;

/**
 * Normalizes user-typed link/image URLs. Bare hosts get `https://`.
 * Returns null for empty or unsafe input.
 */
export function normalizeUrl(
  input: string,
  options: { allowMailto?: boolean; allowDataImage?: boolean } = {}
): string | null {
  const value = input.trim();
  if (!value || BLOCKED_SCHEME.test(value)) return null;

  if (/^data:image\//i.test(value)) {
    return options.allowDataImage ? value : null;
  }
  if (/^mailto:/i.test(value)) {
    return options.allowMailto ? value : null;
  }
  if (/^data:/i.test(value)) return null;
  if (KNOWN_SCHEME.test(value)) return value;
  return `https://${value}`;
}
