'use client';

/**
 * Photo Upload Page
 * Mobile-first interface for uploading and managing chili entry photos
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, AlertCircle, CheckCircle, Clock, Edit2, Save, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import IngredientsList from '@/components/IngredientsList';
import { parseIngredientsList } from '@/lib/text-utils';
import { validateSafe, entryUpdateSchema } from '@/lib/validation';

interface EntryData {
  id: string;
  name: string;
  contestantName: string;
  recipe?: string;
  ingredients: string[];
  allergens: string[];
  spiceLevel: number;
  description?: string;
  photoUrl?: string;
  photoUploadedAt?: string;
  hasPhoto: boolean;
}

interface DeadlineInfo {
  deadline: string;
  beforeDeadline: boolean;
  timeRemaining: number;
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [deadline, setDeadline] = useState<DeadlineInfo | null>(null);
  const [uploadAllowed, setUploadAllowed] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    recipe: '',
    ingredients: '',
    allergens: '',
    spiceLevel: 3,
    description: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch entry data
  useEffect(() => {
    async function fetchEntry() {
      try {
        const response = await fetch(`/api/upload-photo?code=${code}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load entry');
          setLoading(false);
          return;
        }

        setEntry(data.entry);
        setUploadAllowed(data.uploadAllowed);
        setDeadline(data.deadline);

        // Set initial edit data
        setEditData({
          name: data.entry.name || '',
          recipe: data.entry.recipe || '',
          ingredients: data.entry.ingredients?.join(', ') || '',
          allergens: data.entry.allergens?.join(', ') || '',
          spiceLevel: data.entry.spiceLevel || 3,
          description: data.entry.description || '',
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching entry:', err);
        setError('Failed to load entry. Please try again.');
        setLoading(false);
      }
    }

    fetchEntry();
  }, [code]);

  // Countdown timer
  useEffect(() => {
    if (!deadline?.beforeDeadline || !deadline.timeRemaining) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deadlineTime = new Date(deadline.deadline).getTime();
      const remaining = deadlineTime - now;

      if (remaining <= 0) {
        setUploadAllowed(false);
        clearInterval(interval);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  const handleFileSelect = (file: File) => {
    setError('');
    setSuccess('');

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, HEIC, or WebP.');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !entry) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('entry_code', code);
      formData.append('photo', selectedFile);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setSuccess('Photo uploaded successfully! 🎉');
      setEntry({ ...entry, photoUrl: data.photoUrl, hasPhoto: true });
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!entry) return;

    setError('');
    setSuccess('');
    setValidationErrors({});

    // Validate input data
    const validationResult = validateSafe(entryUpdateSchema, {
      entryCode: code,
      name: editData.name,
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

    setUploading(true);

    try {
      const response = await fetch('/api/update-entry', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationResult.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update entry');
        setUploading(false);
        return;
      }

      // Update local entry state
      setEntry({
        ...entry,
        name: data.entry.name,
        contestantName: data.entry.contestantName,
        recipe: data.entry.recipe,
        ingredients: data.entry.ingredients,
        allergens: data.entry.allergens,
        spiceLevel: data.entry.spiceLevel,
        description: data.entry.description,
      });

      setSuccess('Entry updated successfully! ✓');
      setIsEditing(false);
      setUploading(false);
      setValidationErrors({});

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry. Please try again.');
      setUploading(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) return `${days} days`;
    if (days === 1) return '1 day';
    if (hours > 1) return `${hours} hours`;
    if (hours === 1) return '1 hour';
    return 'Less than 1 hour';
  };

  const getUrgencyColor = (ms: number): string => {
    const hours = ms / (1000 * 60 * 60);
    if (hours > 24) return 'text-green-600';
    if (hours > 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your entry...</p>
        </div>
      </main>
    );
  }

  if (error && !entry) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Entry Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Another Code
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{entry?.name}</h1>
              <p className="text-gray-600">by {entry?.contestantName}</p>
              <p className="text-sm text-gray-500 mt-1">Code: <code className="bg-gray-100 px-2 py-1 rounded">{code}</code></p>
            </div>
            {!isEditing && uploadAllowed && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                aria-label="Edit entry details"
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
          </div>

          {/* Deadline Status */}
          {deadline && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              uploadAllowed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <Clock size={20} className={uploadAllowed ? 'text-green-600' : 'text-red-600'} />
              <div className="flex-1">
                {uploadAllowed ? (
                  <p className="text-sm">
                    <span className="font-semibold">Upload deadline:</span>{' '}
                    <span className={getUrgencyColor(deadline.timeRemaining)}>
                      {formatTimeRemaining(deadline.timeRemaining)} remaining
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-red-600">
                    🔒 Deadline passed - No more uploads allowed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3" role="alert">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Current Photo */}
        {entry?.hasPhoto && entry.photoUrl && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Current Photo</h2>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={entry.photoUrl}
                alt={`Photo of ${entry.name}`}
                className="w-full h-full object-cover"
              />
            </div>
            {entry.photoUploadedAt && (
              <p className="text-sm text-gray-500 mt-2">
                Uploaded {new Date(entry.photoUploadedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Photo Upload Section */}
        {uploadAllowed && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {entry?.hasPhoto ? 'Replace Photo' : 'Upload Photo'} 📸
            </h2>

            {/* Preview */}
            {previewUrl && (
              <div className="mb-4">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Photo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Upload Photo
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Cancel"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* File Input */}
            {!previewUrl && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="photo-input"
                  capture="environment"
                />

                <label
                  htmlFor="photo-input"
                  className="flex items-center justify-center gap-3 w-full bg-red-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                >
                  <Camera size={24} />
                  Take Photo
                </label>

                <label
                  htmlFor="photo-input"
                  className="flex items-center justify-center gap-3 w-full bg-white text-red-600 font-semibold py-4 px-6 rounded-lg border-2 border-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <Upload size={24} />
                  Choose from Gallery
                </label>

                <p className="text-sm text-gray-500 text-center">
                  Max file size: 5MB • JPEG, PNG, HEIC, or WebP
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 Photo Tips:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use good lighting</li>
                <li>• Show your chili in its serving dish</li>
                <li>• Make sure the photo is clear and in focus</li>
                <li>• You can replace this photo anytime before the deadline</li>
              </ul>
            </div>
          </div>
        )}

        {/* Entry Details (View/Edit Mode) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Entry Details</h2>
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
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
                  disabled={!uploadAllowed}
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe / Preparation Method
                </label>
                <RichTextEditor
                  value={editData.recipe}
                  onChange={(html) => setEditData({ ...editData, recipe: html })}
                  placeholder="Describe your recipe and preparation method..."
                  maxLength={5000}
                  disabled={!uploadAllowed}
                />
                {validationErrors.recipe && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.recipe}</p>
                )}
              </div>

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
                  disabled={!uploadAllowed}
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
                  disabled={!uploadAllowed}
                />
                {validationErrors.allergens && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.allergens}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spice Level (1-5)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editData.spiceLevel}
                  onChange={(e) => setEditData({ ...editData, spiceLevel: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={!uploadAllowed}
                />
                <p className="text-center text-sm text-gray-600 mt-1">
                  {'🔥'.repeat(editData.spiceLevel)} ({editData.spiceLevel}/5)
                </p>
              </div>

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
                  disabled={!uploadAllowed}
                />
                {validationErrors.description && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
                )}
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              {entry?.recipe && (
                <div>
                  <dt className="font-semibold text-gray-700 mb-2">Recipe:</dt>
                  <dd
                    className="text-gray-600 prose prose-sm max-w-none whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: entry.recipe }}
                  />
                </div>
              )}
              {entry?.ingredients && entry.ingredients.length > 0 && (
                <div>
                  <dt className="font-semibold text-gray-700 mb-2">Ingredients:</dt>
                  <dd className="text-gray-600">
                    <IngredientsList ingredients={entry.ingredients} />
                  </dd>
                </div>
              )}
              {entry?.allergens && entry.allergens.length > 0 && (
                <div>
                  <dt className="font-semibold text-gray-700 mb-2">Allergens:</dt>
                  <dd className="text-gray-600">
                    <IngredientsList ingredients={entry.allergens} className="text-red-600" />
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-semibold text-gray-700">Spice Level:</dt>
                <dd className="text-gray-600 mt-1">
                  {'🔥'.repeat(entry?.spiceLevel || 0)} ({entry?.spiceLevel}/5)
                </dd>
              </div>
              {entry?.description && (
                <div>
                  <dt className="font-semibold text-gray-700">Description:</dt>
                  <dd className="text-gray-600 mt-1">{entry.description}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800 font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
