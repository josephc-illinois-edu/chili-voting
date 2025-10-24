/**
 * Text Normalization Utilities
 * Functions for standardizing text capitalization and formatting
 */

/**
 * Common acronyms that should remain uppercase
 */
const ACRONYMS = new Set([
  'BBQ', 'USA', 'UK', 'US', 'NY', 'LA', 'SF', 'DC',
  'USDA', 'FDA', 'GMO', 'MSG', 'ASAP', 'FAQ',
  'DIY', 'BLT', 'PB&J', 'IPA', 'IPO',
]);

/**
 * Common words that should remain lowercase in titles (unless first word)
 */
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for',
  'in', 'of', 'on', 'or', 'the', 'to', 'with', 'from',
]);

/**
 * Normalize text to Title Case
 * Examples:
 *   "ULTIMATE CHILI" → "Ultimate Chili"
 *   "mom's secret recipe" → "Mom's Secret Recipe"
 *   "BBQ SAUCE" → "BBQ Sauce"
 */
export function normalizeTitle(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Trim whitespace
  text = text.trim();

  // If text is all caps and longer than 3 chars, convert to proper case
  const words = text.split(/\s+/);

  const normalized = words.map((word, index) => {
    // Check if it's a known acronym
    if (ACRONYMS.has(word.toUpperCase())) {
      return word.toUpperCase();
    }

    // Check for possessives (e.g., "mom's")
    if (word.includes("'")) {
      const parts = word.split("'");
      return parts.map((part, i) =>
        i === 0 ? capitalizeWord(part) : part.toLowerCase()
      ).join("'");
    }

    // Check for hyphenated words (e.g., "award-winning")
    if (word.includes('-')) {
      return word.split('-')
        .map(part => capitalizeWord(part))
        .join('-');
    }

    // Lowercase small words (except first word)
    if (index > 0 && LOWERCASE_WORDS.has(word.toLowerCase())) {
      return word.toLowerCase();
    }

    // Capitalize first letter
    return capitalizeWord(word);
  });

  return normalized.join(' ');
}

/**
 * Capitalize the first letter of a word
 */
function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Normalize text to Sentence Case
 * Examples:
 *   "THIS IS AMAZING" → "This is amazing"
 *   "made with LOVE and care" → "Made with love and care"
 */
export function normalizeSentence(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Trim whitespace
  text = text.trim();

  // Split into sentences
  const sentences = text.split(/([.!?]+\s+)/);

  const normalized = sentences.map(sentence => {
    // Skip delimiters
    if (/^[.!?]+\s*$/.test(sentence)) {
      return sentence;
    }

    // Trim and capitalize first letter
    sentence = sentence.trim();
    if (!sentence) return '';

    // Keep acronyms
    const words = sentence.split(/\s+/);
    const processedWords = words.map((word, index) => {
      // Check if it's a known acronym
      if (ACRONYMS.has(word.toUpperCase())) {
        return word.toUpperCase();
      }

      // First word of sentence - capitalize
      if (index === 0) {
        return capitalizeWord(word);
      }

      // Rest - lowercase unless it's an acronym
      return word.toLowerCase();
    });

    return processedWords.join(' ');
  });

  return normalized.join('');
}

/**
 * Parse comma-separated ingredients list
 * Trims whitespace, removes empty entries, normalizes capitalization
 */
export function parseIngredientsList(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  return text
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => normalizeTitle(item))
    // Remove duplicates (case-insensitive)
    .filter((item, index, self) =>
      self.findIndex(i => i.toLowerCase() === item.toLowerCase()) === index
    );
}

/**
 * Format ingredients array as comma-separated string
 */
export function formatIngredientsList(ingredients: string[]): string {
  if (!Array.isArray(ingredients)) return '';
  return ingredients.filter(Boolean).join(', ');
}

/**
 * Parse allergens list (same as ingredients)
 */
export function parseAllergensList(text: string): string[] {
  return parseIngredientsList(text);
}

/**
 * Format allergens array as comma-separated string
 */
export function formatAllergensList(allergens: string[]): string {
  return formatIngredientsList(allergens);
}

/**
 * Clean and normalize multi-line text
 * Removes excessive whitespace and normalizes line breaks
 */
export function normalizeMultilineText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    // Remove trailing whitespace from each line
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    // Remove excessive blank lines (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Trim start and end
    .trim();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validate ingredient count
 */
export function validateIngredientCount(ingredients: string[]): {
  valid: boolean;
  count: number;
  error?: string;
} {
  const count = ingredients.filter(Boolean).length;

  if (count === 0) {
    return { valid: false, count, error: 'At least one ingredient is required' };
  }

  if (count > 50) {
    return { valid: false, count, error: 'Maximum 50 ingredients allowed' };
  }

  return { valid: true, count };
}

/**
 * Validate individual ingredient length
 */
export function validateIngredientLength(ingredient: string): {
  valid: boolean;
  length: number;
  error?: string;
} {
  const length = ingredient.trim().length;

  if (length === 0) {
    return { valid: false, length, error: 'Ingredient cannot be empty' };
  }

  if (length > 100) {
    return { valid: false, length, error: 'Ingredient must not exceed 100 characters' };
  }

  return { valid: true, length };
}

/**
 * Strip HTML tags from text (basic sanitization)
 * For display purposes only - use DOMPurify for security
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Convert plain text to basic HTML paragraphs
 * Used for migrating old plain text recipes
 */
export function plainTextToHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .trim()
    .split(/\n\n+/) // Split by double line breaks (paragraphs)
    .map(paragraph => {
      // Convert single line breaks within paragraphs to <br>
      const content = paragraph
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('<br>');

      return content ? `<p>${content}</p>` : '';
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Extract plain text from HTML
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return html
    // Convert block elements to line breaks
    .replace(/<\/?(p|div|br|li|h[1-6])[^>]*>/gi, '\n')
    // Remove all other tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Clean up whitespace
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * Smart quote replacement (optional)
 * Converts straight quotes to curly quotes
 */
export function smartQuotes(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Opening double quotes
    .replace(/(^|[\s(])"/g, '$1\u201C')
    // Closing double quotes
    .replace(/"/g, '\u201D')
    // Opening single quotes
    .replace(/(^|[\s(])'/g, '$1\u2018')
    // Closing single quotes and apostrophes
    .replace(/'/g, '\u2019');
}
