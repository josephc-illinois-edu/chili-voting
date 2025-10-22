'use client';

import { useState, useEffect } from 'react';
import { ChiliDatabase } from '@/lib/supabase';
import { QRCodeGenerator } from '@/lib/qr-generator';
import { AdminAuth } from '@/lib/admin-auth';
import type { ChiliEntry } from '@/types/database';
import { QrCode, Plus, ArrowLeft, Printer, Lock, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [chilis, setChilis] = useState<ChiliEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, totalVotes: 0, testEntries: 0 });
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
      setStats({
        totalEntries: entries.length,
        totalVotes: votingStats.totalVotes,
        testEntries: testCount
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <a
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Voting</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage entries, generate QR codes, and monitor voting</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-red-600">{stats.totalEntries}</p>
            <p className="text-gray-600 font-semibold">Total Entries</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-blue-600">{stats.totalVotes}</p>
            <p className="text-gray-600 font-semibold">Total Votes Cast</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-4xl font-bold text-yellow-600">{stats.testEntries}</p>
            <p className="text-gray-600 font-semibold">Test Entries</p>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              <Plus size={24} />
              <span>Add New Chili</span>
            </button>

            <button
              onClick={generateAndPrintQRCodes}
              disabled={loading || chilis.length === 0}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-semibold"
            >
              <Printer size={24} />
              <span>{loading ? 'Generating...' : 'Print QR Codes'}</span>
            </button>

            <button
              onClick={handleBulkDeleteTestEntries}
              disabled={loading || stats.testEntries === 0}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors font-semibold"
            >
              <span>🗑️</span>
              <span>Delete Test Entries ({stats.testEntries})</span>
            </button>
          </div>
        </div>

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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            All Entries ({chilis.length})
          </h2>
          {chilis.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No chili entries yet!</p>
              <p className="text-gray-500">Click "Add New Chili" above to create your first entry.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chilis.map((chili) => (
                <div
                  key={chili.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    chili.name.startsWith('Test')
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">{chili.name}</h3>
                        {chili.name.startsWith('Test') && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-semibold">
                            TEST
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">by {chili.contestant_name}</p>

                      {chili.description && (
                        <p className="text-sm text-gray-600 mb-2">{chili.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Votes:</span>
                          <span className="text-gray-600">{chili.vote_count}</span>
                        </div>
                        {chili.vote_count > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Rating:</span>
                            <span className="text-gray-600">⭐ {chili.average_rating.toFixed(1)}/5</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Spice:</span>
                          <span className="text-gray-600">{'🌶️'.repeat(chili.spice_level)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleDeleteChili(chili.id, chili.name)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 transition-colors font-semibold text-sm whitespace-nowrap"
                      >
                        🗑️ Delete
                      </button>
                      {chili.vote_count > 0 && (
                        <span className="text-xs text-center text-gray-500">
                          {chili.vote_count} vote{chili.vote_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
