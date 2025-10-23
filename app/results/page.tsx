'use client';

import { useState, useEffect } from 'react';
import { supabase, ChiliDatabase } from '@/lib/supabase';
import type { ChiliEntry } from '@/types/database';
import { Trophy, Medal, Star, Flame, ArrowLeft, TrendingUp, Wifi, WifiOff, X, Image as ImageIcon } from 'lucide-react';

export default function ResultsPage() {
  const [chilis, setChilis] = useState<ChiliEntry[]>([]);
  const [stats, setStats] = useState({ totalEntries: 0, totalVotes: 0, averageVotesPerEntry: 0 });
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadResults();

    // Set up real-time subscription for votes
    if (realtimeEnabled) {
      const votesChannel = supabase
        .channel('votes_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes'
          },
          (payload) => {
            console.log('Real-time vote update:', payload);
            setLastUpdate(new Date());
            loadResults();
          }
        )
        .subscribe();

      // Also subscribe to chili entries changes
      const entriesChannel = supabase
        .channel('entries_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chili_entries'
          },
          (payload) => {
            console.log('Real-time entry update:', payload);
            setLastUpdate(new Date());
            loadResults();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(votesChannel);
        supabase.removeChannel(entriesChannel);
      };
    }
  }, [realtimeEnabled]);

  const loadResults = async () => {
    try {
      const [entries, votingStats] = await Promise.all([
        ChiliDatabase.getChiliEntries(),
        ChiliDatabase.getVotingStats()
      ]);
      setChilis(entries);
      setStats(votingStats);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (index === 1) return <Medal className="w-8 h-8 text-gray-400" />;
    if (index === 2) return <Medal className="w-8 h-8 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <TrendingUp className="w-16 h-16 text-red-500 animate-pulse mx-auto mb-4" aria-hidden="true" />
          <p className="text-xl text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <main>
          {/* Header */}
          <div className="mb-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-4 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              aria-label="Back to voting page"
            >
              <ArrowLeft size={20} aria-hidden="true" />
              Back to Voting
            </a>

            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-500" aria-hidden="true" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Live Results</h1>
              <p className="text-gray-600">
                {process.env.NEXT_PUBLIC_EVENT_NAME || 'Chili Cook-Off 2025'}
              </p>
            </div>

            {/* Real-time Status */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors focus:ring-2 focus:ring-offset-2 ${
                  realtimeEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
                }`}
                aria-label={`Toggle real-time updates. Currently ${realtimeEnabled ? 'on' : 'off'}`}
                aria-pressed={realtimeEnabled}
              >
                {realtimeEnabled ? <Wifi size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
                <span className="text-sm font-semibold">
                  Real-time: {realtimeEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
              {realtimeEnabled && (
                <span className="text-xs text-gray-500" role="status" aria-live="polite">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" role="region" aria-label="Voting statistics" aria-live="polite">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-red-600" aria-label={`${stats.totalEntries} total entries`}>{stats.totalEntries}</p>
            <p className="text-gray-600">Total Entries</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-red-600" aria-label={`${stats.totalVotes} total votes`}>{stats.totalVotes}</p>
            <p className="text-gray-600">Total Votes</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-red-600" aria-label={`${stats.averageVotesPerEntry.toFixed(1)} average votes per entry`}>{stats.averageVotesPerEntry.toFixed(1)}</p>
            <p className="text-gray-600">Avg Votes/Entry</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4" role="region" aria-label="Chili competition leaderboard" aria-live="polite">
          {chilis.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-xl text-gray-600">No results yet. Start voting!</p>
            </div>
          ) : (
            chilis.map((chili, index) => (
              <article
                key={chili.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                  index < 3 ? 'ring-2 ring-yellow-400' : ''
                }`}
                aria-label={`Rank ${index + 1}: ${chili.name} by ${chili.contestant_name}`}
              >
                <div className="flex flex-col md:flex-row items-start gap-4">
                  {/* Photo */}
                  {chili.photo_url && (
                    <button
                      onClick={() => setLightboxImage({ url: chili.photo_url!, name: chili.name })}
                      className="flex-shrink-0 w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label={`View photo of ${chili.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={chili.photo_url}
                        alt={`${chili.name} by ${chili.contestant_name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}

                  {/* Rank/Medal */}
                  <div className="flex-shrink-0 w-12 text-center" aria-hidden="true">
                    {index < 3 ? (
                      getMedalIcon(index)
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    )}
                  </div>

                  {/* Chili Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      <h2 className="text-2xl font-bold text-gray-800 flex-1">{chili.name}</h2>
                      {chili.photo_url && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold flex items-center gap-1" aria-label="Has photo">
                          <ImageIcon size={12} aria-hidden="true" />
                          Photo
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">by {chili.contestant_name}</p>

                    {chili.description && (
                      <p className="text-sm text-gray-600 mb-3">{chili.description}</p>
                    )}

                    {/* Spice Level */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">Spice Level:</span>
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

                    {/* Voting Stats */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Star size={20} fill="#fbbf24" stroke="#fbbf24" aria-hidden="true" />
                        <span className="sr-only">Average rating: </span>
                        <span className="text-xl font-bold text-gray-800">
                          {chili.vote_count > 0 ? chili.average_rating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold">{chili.vote_count}</span> vote{chili.vote_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-sm text-gray-500" role="status" aria-live="polite">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        </main>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 focus:ring-2 focus:ring-white rounded-lg p-2"
            aria-label="Close lightbox"
          >
            <X size={32} />
          </button>
          <div className="max-w-5xl max-h-[90vh] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-center mt-4 text-lg font-semibold">{lightboxImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
