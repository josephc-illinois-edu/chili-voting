/**
 * Entry code generation utilities
 * Generates unique codes in format: CHILI-XXXX
 */

/**
 * Generate a random 4-character alphanumeric code
 * Excludes ambiguous characters: 0, O, I, l
 * @returns 4-character code (e.g., "7X2M")
 */
function generateRandomCode(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes 0, O, I
  let code = '';

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}

/**
 * Generate a unique entry code with format CHILI-XXXX
 * @returns Entry code string (e.g., "CHILI-7X2M")
 */
export function generateEntryCode(): string {
  const randomPart = generateRandomCode();
  return `CHILI-${randomPart}`;
}

/**
 * Validate entry code format
 * @param code Entry code to validate
 * @returns True if code matches format CHILI-XXXX
 */
export function isValidEntryCode(code: string): boolean {
  const pattern = /^CHILI-[1-9A-HJ-NP-Z]{4}$/;
  return pattern.test(code);
}

/**
 * Format entry code for display (adds dashes if missing)
 * @param code Raw code input
 * @returns Formatted code
 */
export function formatEntryCode(code: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // If it already has CHILI prefix, just format it
  if (cleaned.startsWith('CHILI')) {
    const suffix = cleaned.substring(5, 9);
    return `CHILI-${suffix}`;
  }

  // Otherwise assume it's just the 4-char code
  if (cleaned.length === 4) {
    return `CHILI-${cleaned}`;
  }

  return code; // Return as-is if we can't parse it
}
