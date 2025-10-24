'use client';

import { useState, useEffect } from 'react';
import { ChiliDatabase } from '@/lib/supabase';
import { SessionManager } from '@/lib/session';
import type { ChiliEntry, VoteSubmission } from '@/types/database';
import { Flame, Star, ChevronRight } from 'lucide-react';
import IngredientsList from '@/components/IngredientsList';

export default function Home() {
  const [chilis, setChilis] = useState<ChiliEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChili, setSelectedChili] = useState<ChiliEntry | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteData, setVoteData] = useState({
    overallRating: 0,
    taste: 0,
    presentation: 0,
    creativity: 0,
    spiceBalance: 0,
    comments: ''
  });

  useEffect(() => {
    loadChilis();
    // Initialize device fingerprinting on page load
    SessionManager.initFingerprint().catch(err => {
      console.error('Failed to initialize fingerprint:', err);
    });
  }, []);

  const loadChilis = async () => {
    try {
      const entries = await ChiliDatabase.getChiliEntries();
      setChilis(entries);
    } catch (error) {
      console.error('Error loading chilis:', error);
      alert('Failed to load chili entries. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (chili: ChiliEntry) => {
    if (SessionManager.hasVoted(chili.id)) {
      alert('You have already voted for this chili!');
      return;
    }
    setSelectedChili(chili);
  };

  const submitVote = async () => {
    if (!selectedChili) return;

    if (voteData.overallRating === 0 || voteData.taste === 0 ||
        voteData.presentation === 0 || voteData.creativity === 0 ||
        voteData.spiceBalance === 0) {
      alert('Please rate all categories before submitting.');
      return;
    }

    setVoting(true);
    try {
      const sessionId = SessionManager.getSessionId();
      const deviceFingerprint = await SessionManager.getFingerprint();

      const submission: VoteSubmission & {
        sessionId: string;
        deviceFingerprint?: string;
      } = {
        chiliId: selectedChili.id,
        sessionId,
        deviceFingerprint,
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
      SessionManager.markAsVoted(selectedChili.id);

      alert('Vote submitted successfully!');
      setSelectedChili(null);
      setVoteData({
        overallRating: 0,
        taste: 0,
        presentation: 0,
        creativity: 0,
        spiceBalance: 0,
        comments: ''
      });
      loadChilis(); // Refresh to show updated stats
    } catch (error) {
      console.error('Error submitting vote:', error);
      // Show specific error message if available
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit vote. Please try again.';
      alert(errorMessage);
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
          <p className="text-xl text-gray-600">Loading chili entries...</p>
        </div>
      </div>
    );
  }

  if (selectedChili) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <main>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedChili.name}</h1>
            <p className="text-lg text-gray-600 mb-4">by {selectedChili.contestant_name}</p>

            {selectedChili.description && (
              <p className="text-gray-700 mb-4">{selectedChili.description}</p>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">Spice Level:</span>
                <div className="flex gap-1" role="img" aria-label={`${selectedChili.spice_level} out of 5 spice level`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Flame
                      key={i}
                      size={16}
                      fill={i < selectedChili.spice_level ? '#ef4444' : 'none'}
                      stroke={i < selectedChili.spice_level ? '#ef4444' : '#d1d5db'}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>

              {/* Photo Display */}
              {selectedChili.photo_url && (
                <div className="mt-6">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedChili.photo_url}
                      alt={`${selectedChili.name} by ${selectedChili.contestant_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Recipe Section */}
              {selectedChili.recipe && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Recipe / Preparation Method</h3>
                  <div
                    className="text-sm text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedChili.recipe }}
                  />
                </div>
              )}

              {/* Ingredients Section */}
              {selectedChili.ingredients && selectedChili.ingredients.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Ingredients</h3>
                  <IngredientsList
                    ingredients={selectedChili.ingredients}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Allergens Section */}
              {selectedChili.allergens && selectedChili.allergens.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <span aria-label="Warning">⚠️</span>
                    Allergens
                  </h3>
                  <IngredientsList
                    ingredients={selectedChili.allergens}
                    className="text-sm"
                    itemClassName="text-red-700 font-medium"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
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
                <label htmlFor="comments-textarea" className="block text-sm font-semibold text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  id="comments-textarea"
                  value={voteData.comments}
                  onChange={(e) => setVoteData({ ...voteData, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Share your thoughts about this chili..."
                  aria-describedby="comments-hint"
                />
                <span id="comments-hint" className="sr-only">Optional comments about this chili entry</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedChili(null)}
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <main>
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Flame className="w-20 h-20 text-red-500" aria-hidden="true" />
              </div>
              <h1 className="text-5xl font-bold text-gray-800 mb-3">
                {process.env.NEXT_PUBLIC_EVENT_NAME || 'Chili Cook-Off 2025'}
              </h1>
            <p className="text-xl text-gray-600 mb-2">
              {process.env.NEXT_PUBLIC_EVENT_DATE || 'November 19, 2025'}
            </p>
            <p className="text-lg text-gray-600 mb-6">
              {process.env.NEXT_PUBLIC_EVENT_TIME || '11:00 AM – 1:30 PM'}
            </p>

            {/* Instructions */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-red-800 mb-3">How to Vote</h2>
              <ol className="text-left text-gray-700 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <span><strong>Browse</strong> the chili entries below and find one you&apos;d like to vote for</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <span><strong>Click &quot;Vote Now&quot;</strong> on any chili that interests you</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <span><strong>Rate</strong> the chili in 5 categories using the star system</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
                  <span><strong>Submit</strong> your vote and check out the live results!</span>
                </li>
              </ol>
              <p className="mt-4 text-sm text-gray-600">
                💡 <strong>Tip:</strong> You can vote for multiple chilis, but only once per chili!
              </p>
            </div>

            <nav aria-label="Main navigation">
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/results"
                  className="px-8 py-3 bg-red-500 text-white rounded-md shadow hover:shadow-lg hover:bg-red-600 transition-all font-bold text-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="View live voting results and leaderboard"
                >
                  <span aria-hidden="true">🏆</span> View Live Results
                </a>
                <a
                  href="/admin"
                  className="px-8 py-3 bg-gray-700 text-white rounded-md shadow hover:shadow-lg hover:bg-gray-800 transition-all font-bold text-lg focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
                  aria-label="Access admin panel to manage entries"
                >
                  <span aria-hidden="true">🔐</span> Admin Panel
                </a>
              </div>
            </nav>
          </div>
        </div>

        {/* Chili Entries Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
            Chili Entries ({chilis.length})
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Click on any chili below to cast your vote!
          </p>
        </div>

        {chilis.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No chili entries yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chilis.map((chili) => {
              const hasVoted = SessionManager.hasVoted(chili.id);
              return (
                <div
                  key={chili.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                    hasVoted ? 'opacity-60' : 'hover:shadow-lg'
                  }`}
                >
                  {/* Photo Display */}
                  {chili.photo_url && (
                    <div className="aspect-video w-full bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={chili.photo_url}
                        alt={`${chili.name} by ${chili.contestant_name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{chili.name}</h2>
                    <p className="text-gray-600 mb-3">by {chili.contestant_name}</p>

                    {chili.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{chili.description}</p>
                    )}

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-gray-600">Spice:</span>
                    <div className="flex gap-0.5" role="img" aria-label={`${chili.spice_level} out of 5 spice level`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Flame
                          key={i}
                          size={14}
                          fill={i < chili.spice_level ? '#ef4444' : 'none'}
                          stroke={i < chili.spice_level ? '#ef4444' : '#d1d5db'}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <span>{chili.vote_count} vote{chili.vote_count !== 1 ? 's' : ''}</span>
                    {chili.vote_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" aria-hidden="true" />
                        <span className="sr-only">Average rating: </span>
                        {chili.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                    <button
                      onClick={() => handleVoteClick(chili)}
                      disabled={hasVoted}
                      className={`w-full py-2 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-offset-2 ${
                        hasVoted
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed focus:ring-gray-400'
                          : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                      }`}
                      aria-label={hasVoted ? `Already voted for ${chili.name}` : `Vote for ${chili.name} by ${chili.contestant_name}`}
                      aria-disabled={hasVoted}
                    >
                      {hasVoted ? 'Already Voted' : 'Vote Now'}
                      {!hasVoted && <ChevronRight size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
