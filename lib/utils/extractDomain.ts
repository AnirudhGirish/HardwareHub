/**
 * Extracts the domain from an email address.
 * e.g. "user@mbrdi.mercedes-benz.com" → "mbrdi.mercedes-benz.com"
 */
export function extractDomain(email: string): string {
  const parts = email.split('@')
  if (parts.length !== 2 || !parts[1]) {
    throw new Error('Invalid email address')
  }
  return parts[1].toLowerCase()
}
