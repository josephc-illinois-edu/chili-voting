'use client';

/**
 * Admin Edit Modal Component
 * Full-featured modal for editing chili entries with WYSIWYG support
 */

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import IngredientsList from '@/components/IngredientsList';
import { parseIngredientsList } from '@/lib/text-utils';
import { validateSafe, chiliEntrySchema } from '@/lib/validation';
import type { ChiliEntry } from '@/types/database';

interface AdminEditModalProps {
  entry: ChiliEntry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntry: Partial<ChiliEntry>) => Promise<void>;
}

export default function AdminEditModal({ entry, isOpen, onClose, onSave }: AdminEditModalProps) {
  const [editData, setEditData] = useState({
    name: '',
    contestantName: '',
    recipe: '',
    ingredients: '',
    allergens: '',
    spiceLevel: 3,
    description: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      setEditData({
        name: entry.name || '',
        contestantName: entry.contestant_name || '',
        recipe: entry.recipe || '',
        ingredients: entry.ingredients?.join(', ') || '',
        allergens: entry.allergens?.join(', ') || '',
        spiceLevel: entry.spice_level || 3,
        description: entry.description || '',
      });
      setValidationErrors({});
      setError('');
    }
  }, [entry, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setError('');
    setValidationErrors({});

    // Validate input data
    const validationResult = validateSafe(chiliEntrySchema, {
      name: editData.name,
      contestantName: editData.contestantName,
      recipe: editData.recipe,
      ingredients: editData.ingredients,
      allergens: editData.allergens,
      spiceLevel: editData.spiceLevel,
      description: editData.description,
    });

    if (!validationResult.success) {
      // Convert errors to object for display
      const errorObj: Record<string, string> = {};
      validationResult.errors.forEach(err => {
        errorObj[err.field] = err.message;
      });
      setValidationErrors(errorObj);
      setError('Please fix the validation errors below');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name: editData.name,
        contestant_name: editData.contestantName,
        recipe: editData.recipe,
        ingredients: parseIngredientsList(editData.ingredients),
        allergens: parseIngredientsList(editData.allergens),
        spice_level: editData.spiceLevel,
        description: editData.description,
      });

      onClose();
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 id="edit-modal-title" className="text-2xl font-bold text-gray-800">
              Edit Entry
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Entry Code: <code className="bg-gray-100 px-2 py-1 rounded">{entry.entry_code}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name and Contestant Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chili Name *
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contestant Name *
                </label>
                <input
                  type="text"
                  value={editData.contestantName}
                  onChange={(e) => setEditData({ ...editData, contestantName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    validationErrors.contestantName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.contestantName && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.contestantName}</p>
                )}
              </div>
            </div>

            {/* Spice Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spice Level (1-5)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editData.spiceLevel}
                  onChange={(e) => setEditData({ ...editData, spiceLevel: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-2xl">
                  {'🔥'.repeat(editData.spiceLevel)} ({editData.spiceLevel}/5)
                </span>
              </div>
            </div>

            {/* Recipe WYSIWYG */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe / Preparation Method
              </label>
              <RichTextEditor
                value={editData.recipe}
                onChange={(html) => setEditData({ ...editData, recipe: html })}
                placeholder="Describe the recipe and preparation method..."
                maxLength={5000}
              />
              {validationErrors.recipe && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.recipe}</p>
              )}
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredients (comma-separated)
              </label>
              <textarea
                value={editData.ingredients}
                onChange={(e) => setEditData({ ...editData, ingredients: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  validationErrors.ingredients ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ground beef, tomatoes, onions, chili powder..."
              />
              {validationErrors.ingredients && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.ingredients}</p>
              )}
              {editData.ingredients && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
                  <IngredientsList
                    ingredients={parseIngredientsList(editData.ingredients)}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Allergens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergens (comma-separated)
              </label>
              <input
                type="text"
                value={editData.allergens}
                onChange={(e) => setEditData({ ...editData, allergens: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  validationErrors.allergens ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dairy, nuts, soy..."
              />
              {validationErrors.allergens && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.allergens}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  validationErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Brief description of your chili..."
              />
              {validationErrors.description && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 font-semibold transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
