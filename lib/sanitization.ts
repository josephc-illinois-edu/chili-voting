/**
 * HTML Sanitization Utilities
 * Wrapper around DOMPurify for consistent sanitization across the app
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for recipe/description sanitization
 * Allows safe HTML formatting tags only
 */
const RECIPE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'del',
    'ol', 'ul', 'li',
    'h3', 'h4',
    'a',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
};

/**
 * Configuration for plain text (strips all HTML)
 */
const PLAIN_TEXT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Keep text content, just remove tags
};

/**
 * Configuration for limited HTML (no links, no lists)
 * Used for short descriptions
 */
const LIMITED_HTML_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
  ALLOWED_ATTR: [],
};

/**
 * Sanitize recipe/preparation method HTML
 * Allows rich formatting with paragraphs, lists, headers, links
 */
export function sanitizeRecipeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  try {
    const clean = DOMPurify.sanitize(html, RECIPE_CONFIG);

    // Additional safety: ensure no script execution context
    if (clean.toLowerCase().includes('javascript:') ||
        clean.toLowerCase().includes('data:text/html')) {
      console.warn('Blocked potentially malicious URL in recipe HTML');
      return DOMPurify.sanitize(html, LIMITED_HTML_CONFIG);
    }

    return clean;
  } catch (error) {
    console.error('Error sanitizing recipe HTML:', error);
    return '';
  }
}

/**
 * Sanitize description HTML
 * Allows basic formatting only (no links, no lists)
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  try {
    return DOMPurify.sanitize(html, LIMITED_HTML_CONFIG);
  } catch (error) {
    console.error('Error sanitizing description HTML:', error);
    return '';
  }
}

/**
 * Sanitize to plain text (strip all HTML)
 * Used for ingredient names, allergens, comments
 */
export function sanitizeToPlainText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  try {
    return DOMPurify.sanitize(text, PLAIN_TEXT_CONFIG).trim();
  } catch (error) {
    console.error('Error sanitizing to plain text:', error);
    return '';
  }
}

/**
 * Sanitize and validate URLs
 * Only allows http:// and https:// protocols
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    // Strip whitespace
    url = url.trim();

    // Check protocol
    const urlPattern = /^https?:\/\//i;
    if (!urlPattern.test(url)) {
      return null;
    }

    // Parse URL to validate
    const parsedUrl = new URL(url);

    // Additional validation
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    // Return sanitized URL
    return parsedUrl.toString();
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

/**
 * Deep sanitization for user input objects
 * Recursively sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  config: 'recipe' | 'description' | 'plain' = 'plain'
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === 'string') {
      // Sanitize based on config
      switch (config) {
        case 'recipe':
          result[key] = sanitizeRecipeHtml(value);
          break;
        case 'description':
          result[key] = sanitizeDescriptionHtml(value);
          break;
        case 'plain':
        default:
          result[key] = sanitizeToPlainText(value);
          break;
      }
    } else if (Array.isArray(value)) {
      // Recursively sanitize array items
      result[key] = value.map(item =>
        typeof item === 'string' ? sanitizeToPlainText(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      result[key] = sanitizeObject(value as Record<string, unknown>, config);
    } else {
      // Keep other types as-is (numbers, booleans, etc.)
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Check if HTML contains any dangerous patterns
 * Returns true if potentially dangerous content is detected
 */
export function containsDangerousContent(html: string): boolean {
  if (!html || typeof html !== 'string') return false;

  const dangerousPatterns = [
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<applet/i,
    /<meta/i,
    /<link/i,
    /<base/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<svg[\s\S]*?onload/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Sanitize for display in React components
 * Returns object safe for dangerouslySetInnerHTML
 */
export function createSafeHtml(html: string, config: 'recipe' | 'description' = 'recipe'): {
  __html: string;
} {
  const sanitized = config === 'recipe'
    ? sanitizeRecipeHtml(html)
    : sanitizeDescriptionHtml(html);

  return { __html: sanitized };
}

/**
 * Batch sanitize array of strings
 */
export function sanitizeStringArray(
  strings: string[],
  config: 'recipe' | 'description' | 'plain' = 'plain'
): string[] {
  if (!Array.isArray(strings)) return [];

  return strings.map(str => {
    if (typeof str !== 'string') return '';

    switch (config) {
      case 'recipe':
        return sanitizeRecipeHtml(str);
      case 'description':
        return sanitizeDescriptionHtml(str);
      case 'plain':
      default:
        return sanitizeToPlainText(str);
    }
  });
}

/**
 * Sanitize filename for upload
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'file';

  return filename
    // Remove path traversal
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*\x00-\x1f]/g, '')
    // Limit length
    .slice(0, 255)
    // Fallback if empty
    || 'file';
}

/**
 * Validate and sanitize entry code
 */
export function sanitizeEntryCode(code: string): string | null {
  if (!code || typeof code !== 'string') return null;

  // Remove whitespace and convert to uppercase
  const cleaned = code.trim().toUpperCase();

  // Validate format
  if (!/^CHILI-[A-Z0-9]{4}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Log sanitization for security monitoring
 */
export function logSanitization(
  originalContent: string,
  sanitizedContent: string,
  context: string
) {
  if (originalContent !== sanitizedContent) {
    console.warn('Content was sanitized:', {
      context,
      original: originalContent.slice(0, 100),
      sanitized: sanitizedContent.slice(0, 100),
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Server-side sanitization hook
 * Use this in API routes to sanitize all incoming data
 */
export function sanitizeApiRequest(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      // Determine sanitization level based on field name
      if (key === 'recipe') {
        sanitized[key] = sanitizeRecipeHtml(value);
      } else if (key === 'description') {
        sanitized[key] = sanitizeDescriptionHtml(value);
      } else {
        sanitized[key] = sanitizeToPlainText(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeToPlainText(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeApiRequest(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
