/**
 * Sanitises user-provided free text by stripping HTML tags and script content.
 * Uses a regex approach for server-side compatibility (no DOM required).
 */
export function sanitise(input: string): string {
  return input
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Sanitises an object's string fields (one level deep).
 */
export function sanitiseObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitised = { ...obj }
  for (const key in sanitised) {
    if (typeof sanitised[key] === 'string') {
      (sanitised as Record<string, unknown>)[key] = sanitise(sanitised[key] as string)
    }
  }
  return sanitised
}
