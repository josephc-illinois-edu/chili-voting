'use client';

import { useState, useEffect } from 'react';
import { ChiliDatabase } from '@/lib/supabase';
import { QRCodeGenerator } from '@/lib/qr-generator';
import { AdminAuth } from '@/lib/admin-auth';
import type { ChiliEntry } from '@/types/database';
import { Plus, ArrowLeft, Printer, Lock, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [chilis, setChilis] = useState<ChiliEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, totalVotes: 0, testEntries: 0, entriesWithPhotos: 0 });
  const [formData, setFormData] = useState({
    name: '',
    contestantName: '',
    recipe: '',
    ingredients: '',
    allergens: '',
    spiceLevel: 3,
    description: ''
  });

  useEffect(() => {
    // Check if already authenticated
    if (AdminAuth.isAuthenticated()) {
      setIsAuthenticated(true);
      loadChilis();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (AdminAuth.verifyPassword(password)) {
      AdminAuth.createSession();
      setIsAuthenticated(true);
      setPassword('');
      loadChilis();
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    AdminAuth.clearSession();
    setIsAuthenticated(false);
    setChilis([]);
  };

  const loadChilis = async () => {
    try {
      const [entries, votingStats] = await Promise.all([
        ChiliDatabase.getChiliEntries(),
        ChiliDatabase.getVotingStats()
      ]);
      setChilis(entries);

      const testCount = entries.filter(e => e.name.startsWith('Test')).length;
      const photosCount = entries.filter(e => e.photo_url).length;
      setStats({
        totalEntries: entries.length,
        totalVotes: votingStats.totalVotes,
        testEntries: testCount,
        entriesWithPhotos: photosCount
      });
    } catch (error) {
      console.error('Error loading chilis:', error);
    }
  };

  const handleDeleteChili = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all votes for this chili.`)) {
      return;
    }

    setLoading(true);
    try {
      await ChiliDatabase.deleteChiliEntry(id);
      alert('Chili entry deleted successfully!');
      loadChilis();
    } catch (error) {
      console.error('Error deleting chili:', error);
      alert('Failed to delete chili entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteTestEntries = async () => {
    const testCount = chilis.filter(c => c.name.startsWith('Test')).length;

    if (testCount === 0) {
      alert('No test entries found.');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${testCount} test entries? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const deletedCount = await ChiliDatabase.deleteTestEntries();
      alert(`Successfully deleted ${deletedCount} test entries!`);
      loadChilis();
    } catch (error) {
      console.error('Error deleting test entries:', error);
      alert('Failed to delete test entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChili = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ChiliDatabase.submitChiliEntry(formData);
      alert('Chili entry added successfully!');
      setFormData({
        name: '',
        contestantName: '',
        recipe: '',
        ingredients: '',
        allergens: '',
        spiceLevel: 3,
        description: ''
      });
      setShowAddForm(false);
      loadChilis();
    } catch (error) {
      console.error('Error adding chili:', error);
      alert('Failed to add chili entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAndPrintQRCodes = async () => {
    if (chilis.length === 0) {
      alert('No chilis found. Add some entries first!');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const qrCodes = await QRCodeGenerator.generateAllQRCodes(chilis, baseUrl);
      const printableHTML = QRCodeGenerator.generatePrintableHTML(qrCodes);

      // Open new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printableHTML);
        printWindow.document.close();
        printWindow.focus();

        // Auto-trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Error generating QR codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Admin Login
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Enter admin password to access the admin panel
          </p>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter admin password"
                required
                autoFocus
              />
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Admin Panel (authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <main>
          {/* Header */}
          <header className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <nav className="flex justify-between items-center mb-4" aria-label="Admin navigation">
              <a
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded"
                aria-label="Back to voting page"
              >
                <ArrowLeft size={20} aria-hidden="true" />
                <span>Back to Voting</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="Logout from admin dashboard"
              >
                <LogOut size={18} aria-hidden="true" />
                Logout
              </button>
            </nav>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage entries, generate QR codes, and monitor voting</p>
          </header>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" role="region" aria-label="Dashboard statistics">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-red-600" aria-label={`${stats.totalEntries} total entries`}>{stats.totalEntries}</p>
            <p className="text-gray-600 font-semibold">Total Entries</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-blue-600" aria-label={`${stats.totalVotes} total votes cast`}>{stats.totalVotes}</p>
            <p className="text-gray-600 font-semibold">Total Votes Cast</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-green-600" aria-label={`${stats.entriesWithPhotos} entries with photos`}>{stats.entriesWithPhotos}</p>
            <p className="text-gray-600 font-semibold">📸 With Photos</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-yellow-600" aria-label={`${stats.testEntries} test entries`}>{stats.testEntries}</p>
            <p className="text-gray-600 font-semibold">Test Entries</p>
          </div>
        </div>

        {/* Primary Actions */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label={showAddForm ? "Close add new chili form" : "Open add new chili form"}
              aria-expanded={showAddForm}
            >
              <Plus size={24} aria-hidden="true" />
              <span>Add New Chili</span>
            </button>

            <button
              onClick={generateAndPrintQRCodes}
              disabled={loading || chilis.length === 0}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-semibold focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Print QR codes for all ${chilis.length} chili entries`}
              aria-busy={loading}
            >
              <Printer size={24} aria-hidden="true" />
              <span>{loading ? 'Generating...' : 'Print QR Codes'}</span>
            </button>

            <button
              onClick={handleBulkDeleteTestEntries}
              disabled={loading || stats.testEntries === 0}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors font-semibold focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={`Delete all ${stats.testEntries} test entries`}
              aria-busy={loading}
            >
              <span aria-hidden="true">🗑️</span>
              <span>Delete Test Entries ({stats.testEntries})</span>
            </button>
          </div>
        </section>

        {/* Add Chili Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Chili</h2>
            <form onSubmit={handleSubmitChili} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chili Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contestant Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contestantName}
                    onChange={(e) => setFormData({ ...formData, contestantName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Spice Level (1-5) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.spiceLevel}
                  onChange={(e) => setFormData({ ...formData, spiceLevel: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ingredients (comma-separated)
                </label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                  placeholder="beef, beans, tomatoes, spices (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allergens (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="dairy, nuts (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipe
                </label>
                <textarea
                  value={formData.recipe}
                  onChange={(e) => setFormData({ ...formData, recipe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Optional recipe or preparation notes"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 disabled:bg-gray-300 transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Chili'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Chili List */}
        <section className="bg-white rounded-lg shadow-lg p-6" aria-labelledby="all-entries-heading">
          <h2 id="all-entries-heading" className="text-2xl font-bold text-gray-800 mb-4">
            All Entries ({chilis.length})
          </h2>
          {chilis.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No chili entries yet!</p>
              <p className="text-gray-500">Click &quot;Add New Chili&quot; above to create your first entry.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chilis.map((chili) => (
                <article
                  key={chili.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    chili.name.startsWith('Test')
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  aria-label={`${chili.name} by ${chili.contestant_name}`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-800">{chili.name}</h3>
                        {chili.name.startsWith('Test') && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-semibold" role="status">
                            TEST
                          </span>
                        )}
                        {chili.photo_url && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold" role="status" aria-label="Photo uploaded">
                            📸 Photo
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">by {chili.contestant_name}</p>
                      {chili.entry_code && (
                        <p className="text-sm text-gray-500 mb-2">
                          <span className="font-semibold">Code:</span>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{chili.entry_code}</code>
                          <a
                            href={`/upload/${chili.entry_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-700 text-xs underline"
                            aria-label={`View upload page for ${chili.name}`}
                          >
                            View Upload Page →
                          </a>
                        </p>
                      )}

                      {chili.description && (
                        <p className="text-sm text-gray-600 mb-2">{chili.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Votes:</span>
                          <span className="text-gray-600">{chili.vote_count}</span>
                        </div>
                        {chili.vote_count > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Rating:</span>
                            <span className="text-gray-600"><span aria-hidden="true">⭐</span> {chili.average_rating.toFixed(1)}/5</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Spice:</span>
                          <span className="text-gray-600" role="img" aria-label={`${chili.spice_level} out of 5 spice level`}>
                            <span aria-hidden="true">{'🌶️'.repeat(chili.spice_level)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 items-stretch sm:items-end">
                      <button
                        onClick={() => handleDeleteChili(chili.id, chili.name)}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 transition-colors font-semibold text-sm whitespace-nowrap focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Delete ${chili.name} and its ${chili.vote_count} votes`}
                        aria-busy={loading}
                      >
                        <span aria-hidden="true">🗑️</span> Delete
                      </button>
                      {chili.vote_count > 0 && (
                        <span className="text-xs text-center text-gray-500 self-center sm:self-auto" aria-hidden="true">
                          {chili.vote_count} vote{chili.vote_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        </main>
      </div>
    </div>
  );
}
