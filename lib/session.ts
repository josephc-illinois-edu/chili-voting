/**
 * Anonymous session management for chili voting
 * @fileoverview Handles voter sessions without requiring user login
 */

export class SessionManager {
  private static SESSION_KEY = 'chili_voter_session';
  private static VOTED_KEY = 'voted_chilis';

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
