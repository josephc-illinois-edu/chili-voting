'use client';

import { useState, useEffect } from 'react';
import { supabase, ChiliDatabase } from '@/lib/supabase';
import type { ChiliEntry } from '@/types/database';
import { Trophy, Medal, Star, Flame, ArrowLeft, TrendingUp, Wifi, WifiOff } from 'lucide-react';

export default function ResultsPage() {
  const [chilis, setChilis] = useState<ChiliEntry[]>([]);
  const [stats, setStats] = useState({ totalEntries: 0, totalVotes: 0, averageVotesPerEntry: 0 });
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-red-500 animate-pulse mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Voting
          </a>

          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-16 h-16 text-yellow-500" />
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
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                realtimeEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {realtimeEnabled ? <Wifi size={18} /> : <WifiOff size={18} />}
              <span className="text-sm font-semibold">
                Real-time: {realtimeEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
            {realtimeEnabled && (
              <span className="text-xs text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.totalEntries}</p>
            <p className="text-gray-600">Total Entries</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.totalVotes}</p>
            <p className="text-gray-600">Total Votes</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.averageVotesPerEntry.toFixed(1)}</p>
            <p className="text-gray-600">Avg Votes/Entry</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {chilis.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-xl text-gray-600">No results yet. Start voting!</p>
            </div>
          ) : (
            chilis.map((chili, index) => (
              <div
                key={chili.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                  index < 3 ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank/Medal */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {index < 3 ? (
                      getMedalIcon(index)
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    )}
                  </div>

                  {/* Chili Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{chili.name}</h2>
                    <p className="text-gray-600 mb-3">by {chili.contestant_name}</p>

                    {chili.description && (
                      <p className="text-sm text-gray-600 mb-3">{chili.description}</p>
                    )}

                    {/* Spice Level */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">Spice Level:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Flame
                            key={i}
                            size={14}
                            fill={i < chili.spice_level ? '#ef4444' : 'none'}
                            stroke={i < chili.spice_level ? '#ef4444' : '#d1d5db'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Voting Stats */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Star size={20} fill="#fbbf24" stroke="#fbbf24" />
                        <span className="text-xl font-bold text-gray-800">
                          {chili.vote_count > 0 ? chili.average_rating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold">{chili.vote_count}</span> votes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
