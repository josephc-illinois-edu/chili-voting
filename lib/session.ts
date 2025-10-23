/**
 * Anonymous session management for chili voting
 * @fileoverview Handles voter sessions without requiring user login
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import type { Agent } from '@fingerprintjs/fingerprintjs';

export class SessionManager {
  private static SESSION_KEY = 'chili_voter_session';
  private static VOTED_KEY = 'voted_chilis';
  private static FINGERPRINT_KEY = 'device_fingerprint';
  private static fpPromise: Promise<Agent> | null = null;

  /**
   * Initialize browser fingerprinting
   * Should be called once when the app loads
   */
  static async initFingerprint(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Initialize FingerprintJS
      if (!this.fpPromise) {
        this.fpPromise = FingerprintJS.load();
      }

      const fp = await this.fpPromise;
      const result = await fp.get();
      const fingerprint = result.visitorId;

      // Store fingerprint in localStorage for quick access
      localStorage.setItem(this.FINGERPRINT_KEY, fingerprint);
    } catch (error) {
      console.error('Failed to generate fingerprint:', error);
      // Fallback to a basic fingerprint based on user agent and screen
      const fallback = this.generateFallbackFingerprint();
      localStorage.setItem(this.FINGERPRINT_KEY, fallback);
    }
  }

  /**
   * Get device fingerprint
   * @returns Promise<string> Device fingerprint hash
   */
  static async getFingerprint(): Promise<string> {
    if (typeof window === 'undefined') {
      return 'server_fingerprint';
    }

    // Try to get from localStorage first (already initialized)
    let fingerprint = localStorage.getItem(this.FINGERPRINT_KEY);

    if (!fingerprint) {
      // Not initialized yet, do it now
      await this.initFingerprint();
      fingerprint = localStorage.getItem(this.FINGERPRINT_KEY);
    }

    return fingerprint || this.generateFallbackFingerprint();
  }

  /**
   * Generate fallback fingerprint if FingerprintJS fails
   * @returns string Basic fingerprint
   */
  private static generateFallbackFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const txt = 'fingerprint';

    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText(txt, 2, 2);
    }

    const canvasData = canvas.toDataURL();

    // Combine various browser characteristics
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      canvasData.substring(0, 50) // First 50 chars of canvas fingerprint
    ];

    // Simple hash function
    const hash = components.join('|');
    return 'fallback_' + btoa(hash).substring(0, 32);
  }

  /**
   * Get or create anonymous session ID
   * @returns string Unique session identifier
   */
  static getSessionId(): string {
    // Server-side rendering safety check
    if (typeof window === 'undefined') {
      return `server_session_${Date.now()}`;
    }

    let sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * Check if user has voted for a specific chili
   * @param chiliId Chili entry identifier
   * @returns boolean True if already voted
   */
  static hasVoted(chiliId: string): boolean {
    if (typeof window === 'undefined') return false;

    const voted = JSON.parse(localStorage.getItem(this.VOTED_KEY) || '[]');
    return voted.includes(chiliId);
  }

  /**
   * Mark chili as voted
   * @param chiliId Chili entry identifier
   */
  static markAsVoted(chiliId: string): void {
    if (typeof window === 'undefined') return;

    const voted = JSON.parse(localStorage.getItem(this.VOTED_KEY) || '[]');
    if (!voted.includes(chiliId)) {
      voted.push(chiliId);
      localStorage.setItem(this.VOTED_KEY, JSON.stringify(voted));
    }
  }

  /**
   * Get all voted chili IDs for current session
   * @returns string[] Array of chili IDs already voted on
   */
  static getVotedChilis(): string[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.VOTED_KEY) || '[]');
  }

  /**
   * Clear session data (for testing or reset)
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.VOTED_KEY);
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): {
    sessionId: string;
    votedCount: number;
    votedChilis: string[];
  } {
    return {
      sessionId: this.getSessionId(),
      votedCount: this.getVotedChilis().length,
      votedChilis: this.getVotedChilis()
    };
  }
}
