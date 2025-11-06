'use client';

/**
 * Upload Landing Page
 * Entry point for entrants to access their entry using entry code
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatEntryCode, isValidEntryCode } from '@/lib/entry-codes';
import { Camera, Check } from 'lucide-react';

export default function UploadLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formatted = formatEntryCode(code);

    if (!isValidEntryCode(formatted)) {
      setError('Invalid code format. Please enter a code like CHILI-XXXX');
      return;
    }

    // Navigate to the upload page for this code
    router.push(`/upload/${formatted}`);
  };

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase());
    setError('');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Camera className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Upload Your Chili Photo
          </h1>
          <p className="text-gray-600">
            Enter your entry code to get started
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            What you can do:
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Upload a photo of your chili</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Update your entry details</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Replace your photo anytime before the deadline</span>
            </li>
          </ul>
        </div>

        {/* Entry Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="entry-code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Your Entry Code
              </label>
              <input
                id="entry-code"
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="CHILI-XXXX"
                maxLength={10}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all uppercase"
                aria-describedby={error ? 'code-error' : 'code-help'}
                aria-invalid={!!error}
              />
              {error ? (
                <p id="code-error" className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : (
                <p id="code-help" className="mt-2 text-sm text-gray-500">
                  Find your code in the confirmation email
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={code.length < 4}
              className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Continue
            </button>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <details className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <summary className="font-semibold text-gray-700 cursor-pointer hover:text-red-600 transition-colors">
              Need help? Click here
            </summary>
            <div className="mt-4 space-y-3 text-left text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-800">Where is my code?</p>
                <p>Check the confirmation email you received after registering your chili. It should look like: <code className="bg-gray-100 px-2 py-1 rounded">CHILI-7X2M</code></p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Lost your code?</p>
                <p>Contact the event organizer for assistance.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">When is the deadline?</p>
                <p>Photos must be uploaded by noon on the day of the event. You can replace your photo anytime before then.</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
