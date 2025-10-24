/**
 * Validation Schemas using Zod
 * Comprehensive validation for all user inputs with XSS detection
 */

import { z } from 'zod';

/**
 * Detect potentially malicious content
 * Checks for common XSS patterns
 */
function detectMaliciousContent(value: string): boolean {
  const maliciousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<iframe[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];

  return maliciousPatterns.some(pattern => pattern.test(value));
}

/**
 * Custom Zod refinement for XSS detection
 */
const noMaliciousContent = (value: string) => {
  if (detectMaliciousContent(value)) {
    return false;
  }
  return true;
};

/**
 * Entry Code Validation
 */
export const entryCodeSchema = z.string()
  .regex(/^CHILI-[A-Z0-9]{4}$/, 'Invalid entry code format. Expected format: CHILI-XXXX');

/**
 * Chili Entry Schema (for create/update)
 */
export const chiliEntrySchema = z.object({
  name: z.string()
    .min(3, 'Chili name must be at least 3 characters')
    .max(100, 'Chili name must not exceed 100 characters')
    .refine(noMaliciousContent, 'Invalid characters detected'),

  contestantName: z.string()
    .min(2, 'Contestant name must be at least 2 characters')
    .max(100, 'Contestant name must not exceed 100 characters')
    .refine(noMaliciousContent, 'Invalid characters detected')
    .optional(),

  recipe: z.string()
    .max(5000, 'Recipe must not exceed 5000 characters')
    .refine(noMaliciousContent, 'Invalid content detected in recipe')
    .optional()
    .or(z.literal('')),

  ingredients: z.string()
    .max(2000, 'Ingredients list is too long')
    .refine(noMaliciousContent, 'Invalid characters detected in ingredients')
    .optional()
    .or(z.literal('')),

  allergens: z.string()
    .max(500, 'Allergens list is too long')
    .refine(noMaliciousContent, 'Invalid characters detected in allergens')
    .optional()
    .or(z.literal('')),

  spiceLevel: z.number()
    .int('Spice level must be a whole number')
    .min(1, 'Spice level must be at least 1')
    .max(5, 'Spice level must not exceed 5')
    .or(z.string().transform(val => parseInt(val, 10))),

  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .refine(noMaliciousContent, 'Invalid characters detected in description')
    .optional()
    .or(z.literal('')),
});

/**
 * Entry Update Schema (for user edits via /upload/[code])
 */
export const entryUpdateSchema = z.object({
  entryCode: entryCodeSchema,
  name: chiliEntrySchema.shape.name,
  recipe: chiliEntrySchema.shape.recipe,
  ingredients: chiliEntrySchema.shape.ingredients,
  allergens: chiliEntrySchema.shape.allergens,
  spiceLevel: chiliEntrySchema.shape.spiceLevel,
  description: chiliEntrySchema.shape.description,
});

/**
 * Admin Entry Update Schema (allows more fields)
 */
export const adminEntryUpdateSchema = entryUpdateSchema.extend({
  contestantName: chiliEntrySchema.shape.contestantName,
});

/**
 * Vote Submission Schema
 */
export const voteSubmissionSchema = z.object({
  chiliId: z.string().uuid('Invalid chili ID format'),

  overallRating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),

  categoryRatings: z.object({
    taste: z.number().int().min(1).max(5),
    presentation: z.number().int().min(1).max(5),
    creativity: z.number().int().min(1).max(5),
    spiceBalance: z.number().int().min(1).max(5),
  }),

  comments: z.string()
    .max(500, 'Comments must not exceed 500 characters')
    .refine(noMaliciousContent, 'Invalid characters detected in comments')
    .optional()
    .or(z.literal('')),

  sessionId: z.string().min(1, 'Session ID is required'),
  deviceFingerprint: z.string().optional(),
});

/**
 * Photo Upload Schema
 */
export const photoUploadSchema = z.object({
  entryCode: entryCodeSchema,
  fileSize: z.number()
    .max(5 * 1024 * 1024, 'File size must not exceed 5MB'),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/heic', 'image/webp'], {
    message: 'File must be JPEG, PNG, HEIC, or WebP'
  }),
});

/**
 * Chili Submission Schema (Google Forms integration)
 */
export const chiliSubmissionSchema = z.object({
  name: chiliEntrySchema.shape.name,
  contestantName: z.string()
    .min(2, 'Contestant name must be at least 2 characters')
    .max(100, 'Contestant name must not exceed 100 characters')
    .refine(noMaliciousContent, 'Invalid characters detected'),
  recipe: chiliEntrySchema.shape.recipe,
  ingredients: chiliEntrySchema.shape.ingredients,
  allergens: chiliEntrySchema.shape.allergens,
  spiceLevel: chiliEntrySchema.shape.spiceLevel,
  description: chiliEntrySchema.shape.description,
});

/**
 * Type exports for TypeScript
 */
export type ChiliEntryInput = z.infer<typeof chiliEntrySchema>;
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>;
export type AdminEntryUpdateInput = z.infer<typeof adminEntryUpdateSchema>;
export type VoteSubmissionInput = z.infer<typeof voteSubmissionSchema>;
export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;
export type ChiliSubmissionInput = z.infer<typeof chiliSubmissionSchema>;

/**
 * Validation helper functions
 */

/**
 * Validate and return parsed data or throw with formatted errors
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ValidationError('Validation failed', errors);
  }

  return result.data;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
