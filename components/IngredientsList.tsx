'use client';

/**
 * Ingredients List Component
 * Displays ingredients as a formatted bulleted list
 */

import { sanitizeToPlainText } from '@/lib/sanitization';
import { normalizeTitle } from '@/lib/text-utils';

interface IngredientsListProps {
  ingredients: string[];
  className?: string;
  itemClassName?: string;
  emptyMessage?: string;
  normalize?: boolean; // Apply title case normalization
}

export default function IngredientsList({
  ingredients,
  className = '',
  itemClassName = '',
  emptyMessage = 'No ingredients listed',
  normalize = true,
}: IngredientsListProps) {
  // Filter and sanitize ingredients
  const safeIngredients = ingredients
    .filter(Boolean)
    .map(ingredient => {
      const sanitized = sanitizeToPlainText(ingredient);
      return normalize ? normalizeTitle(sanitized) : sanitized;
    })
    .filter(ingredient => ingredient.trim().length > 0);

  if (safeIngredients.length === 0) {
    return (
      <p className="text-gray-500 italic text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={`list-disc list-inside space-y-1 ${className}`}>
      {safeIngredients.map((ingredient, index) => (
        <li
          key={index}
          className={`text-gray-700 ${itemClassName}`}
        >
          {ingredient}
        </li>
      ))}
    </ul>
  );
}

/**
 * Compact inline ingredients display (comma-separated)
 */
interface IngredientsInlineProps {
  ingredients: string[];
  className?: string;
  emptyMessage?: string;
  normalize?: boolean;
  maxLength?: number; // Truncate after N characters
}

export function IngredientsInline({
  ingredients,
  className = '',
  emptyMessage = 'No ingredients listed',
  normalize = true,
  maxLength,
}: IngredientsInlineProps) {
  // Filter and sanitize ingredients
  const safeIngredients = ingredients
    .filter(Boolean)
    .map(ingredient => {
      const sanitized = sanitizeToPlainText(ingredient);
      return normalize ? normalizeTitle(sanitized) : sanitized;
    })
    .filter(ingredient => ingredient.trim().length > 0);

  if (safeIngredients.length === 0) {
    return (
      <span className="text-gray-500 italic text-sm">
        {emptyMessage}
      </span>
    );
  }

  let text = safeIngredients.join(', ');

  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    const truncated = text.slice(0, maxLength - 3);
    const lastComma = truncated.lastIndexOf(',');
    text = (lastComma > 0 ? truncated.slice(0, lastComma) : truncated) + '...';
  }

  return (
    <span className={`text-gray-700 ${className}`}>
      {text}
    </span>
  );
}

/**
 * Allergens list with warning icon
 */
interface AllergensListProps {
  allergens: string[];
  className?: string;
  showIcon?: boolean;
  emptyMessage?: string;
}

export function AllergensList({
  allergens,
  className = '',
  showIcon = true,
  emptyMessage = 'No allergens listed',
}: AllergensListProps) {
  // Filter and sanitize allergens
  const safeAllergens = allergens
    .filter(Boolean)
    .map(allergen => sanitizeToPlainText(allergen))
    .map(allergen => normalizeTitle(allergen))
    .filter(allergen => allergen.trim().length > 0);

  if (safeAllergens.length === 0) {
    return (
      <p className="text-gray-500 italic text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {showIcon && (
        <span className="text-red-600 text-lg flex-shrink-0" aria-label="Warning">
          ⚠️
        </span>
      )}
      <ul className="list-disc list-inside space-y-1 flex-1">
        {safeAllergens.map((allergen, index) => (
          <li
            key={index}
            className="text-red-700 font-medium"
          >
            {allergen}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ingredients count badge
 */
interface IngredientsCountProps {
  count: number;
  className?: string;
}

export function IngredientsCount({ count, className = '' }: IngredientsCountProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
    >
      {count} {count === 1 ? 'ingredient' : 'ingredients'}
    </span>
  );
}
