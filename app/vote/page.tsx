'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChiliDatabase } from '@/lib/supabase';
import { SessionManager } from '@/lib/session';
import type { ChiliEntry, VoteSubmission } from '@/types/database';
import { Flame, Star, ArrowLeft } from 'lucide-react';

/**
 * QR Code Voting Page
 * This page handles direct voting links from QR codes
 * URL format: /vote?chili=<chili_id>
 */
function VotePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chiliId = searchParams.get('chili');

  const [chili, setChili] = useState<ChiliEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteData, setVoteData] = useState({
    overallRating: 0,
    taste: 0,
    presentation: 0,
    creativity: 0,
    spiceBalance: 0,
    comments: ''
  });

  useEffect(() => {
    loadChili();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiliId]);

  const loadChili = async () => {
    if (!chiliId) {
      setLoading(false);
      setError('No chili ID provided. Redirecting to home...');
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    try {
      setLoading(true);
      const allChilis = await ChiliDatabase.getChiliEntries();
      const targetChili = allChilis.find((c) => c.id === chiliId);

      if (!targetChili) {
        setError('Chili not found. Redirecting to home...');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      // Check if user already voted for this chili
      if (SessionManager.hasVoted(chiliId)) {
        setError('You have already voted for this chili!');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      setChili(targetChili);
    } catch (err) {
      console.error('Error loading chili:', err);
      setError('Failed to load chili entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitVote = async () => {
    if (!chili) return;

    // Validate all ratings are filled
    if (voteData.overallRating === 0 || voteData.taste === 0 ||
        voteData.presentation === 0 || voteData.creativity === 0 ||
        voteData.spiceBalance === 0) {
      alert('Please rate all categories before submitting.');
      return;
    }

    setVoting(true);
    try {
      const sessionId = SessionManager.getSessionId();
      const submission: VoteSubmission & { sessionId: string } = {
        chiliId: chili.id,
        sessionId,
        overallRating: voteData.overallRating,
        categoryRatings: {
          taste: voteData.taste,
          presentation: voteData.presentation,
          creativity: voteData.creativity,
          spiceBalance: voteData.spiceBalance
        },
        comments: voteData.comments
      };

      await ChiliDatabase.submitVote(submission);
      SessionManager.markAsVoted(chili.id);

      alert('Vote submitted successfully! Thank you for voting!');
      router.push('/');
    } catch (err) {
      console.error('Error submitting vote:', err);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => {
    return (
      <div className="flex gap-1" role="group" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' && star < 5) {
                onChange(star + 1);
              } else if (e.key === 'ArrowLeft' && star > 1) {
                onChange(star - 1);
              }
            }}
            aria-label={`Rate ${star} out of 5 stars`}
            aria-pressed={star === value}
            className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded transition-all"
          >
            <Star
              size={32}
              fill={star <= value ? '#fbbf24' : 'none'}
              stroke={star <= value ? '#fbbf24' : '#d1d5db'}
              className="cursor-pointer transition-colors"
              aria-hidden="true"
            />
          </button>
        ))}
        <span className="sr-only">{value > 0 ? `Current rating: ${value} out of 5 stars` : 'No rating selected'}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <Flame className="w-16 h-16 text-red-500 animate-bounce mx-auto mb-4" aria-hidden="true" />
          <p className="text-xl text-gray-600">Loading chili entry...</p>
        </div>
      </div>
    );
  }

  if (error || !chili) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <main>
          <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md" role="alert" aria-live="assertive">
            <Flame className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h1>
            <p className="text-gray-600 mb-4">{error || 'Something went wrong'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Return to home page"
            >
              Go to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <main>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded"
            aria-label="Back to all chili entries"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to All Chilis</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{chili.name}</h1>
              <p className="text-lg text-gray-600 mb-4">by {chili.contestant_name}</p>

              {chili.description && (
                <p className="text-gray-700 mb-4">{chili.description}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Spice Level:</span>
                <div className="flex gap-1" role="img" aria-label={`${chili.spice_level} out of 5 spice level`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Flame
                      key={i}
                      size={16}
                      fill={i < chili.spice_level ? '#ef4444' : 'none'}
                      stroke={i < chili.spice_level ? '#ef4444' : '#d1d5db'}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>

              {/* Photo Display */}
              {chili.photo_url && (
                <div className="mt-6">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chili.photo_url}
                      alt={`${chili.name} by ${chili.contestant_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Rate This Chili</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Overall Rating *
                </label>
                <StarRating
                  value={voteData.overallRating}
                  onChange={(val) => setVoteData({ ...voteData, overallRating: val })}
                  label="Overall"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Taste *
                </label>
                <StarRating
                  value={voteData.taste}
                  onChange={(val) => setVoteData({ ...voteData, taste: val })}
                  label="Taste"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Presentation *
                </label>
                <StarRating
                  value={voteData.presentation}
                  onChange={(val) => setVoteData({ ...voteData, presentation: val })}
                  label="Presentation"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Creativity *
                </label>
                <StarRating
                  value={voteData.creativity}
                  onChange={(val) => setVoteData({ ...voteData, creativity: val })}
                  label="Creativity"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Spice Balance *
                </label>
                <StarRating
                  value={voteData.spiceBalance}
                  onChange={(val) => setVoteData({ ...voteData, spiceBalance: val })}
                  label="Spice Balance"
                />
              </div>

              <div>
                <label htmlFor="vote-comments-textarea" className="block text-sm font-semibold text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  id="vote-comments-textarea"
                  value={voteData.comments}
                  onChange={(e) => setVoteData({ ...voteData, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Share your thoughts about this chili..."
                  aria-describedby="vote-comments-hint"
                />
                <span id="vote-comments-hint" className="sr-only">Optional comments about your experience with this chili</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  aria-label="Cancel voting and return to chili list"
                >
                  Cancel
                </button>
                <button
                  onClick={submitVote}
                  disabled={voting}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 disabled:bg-gray-300 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Submit your vote for this chili"
                  aria-busy={voting}
                >
                  {voting ? 'Submitting...' : 'Submit Vote'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-16 h-16 text-red-500 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}
