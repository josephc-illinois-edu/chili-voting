/**
 * Simple admin authentication utility
 * Uses environment variable for admin password
 */

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_KEY = 'chili_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSession {
  authenticated: boolean;
  expires: number;
}

export class AdminAuth {
  /**
   * Verify admin password
   */
  static verifyPassword(password: string): boolean {
    return password === ADMIN_PASSWORD;
  }

  /**
   * Create admin session after successful login
   */
  static createSession(): void {
    if (typeof window === 'undefined') return;

    const session: AdminSession = {
      authenticated: true,
      expires: Date.now() + SESSION_DURATION
    };

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Check if current session is valid
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionData) return false;

      const session: AdminSession = JSON.parse(sessionData);

      // Check if session has expired
      if (session.expires < Date.now()) {
        this.clearSession();
        return false;
      }

      return session.authenticated;
    } catch (error) {
      console.error('Error checking admin session:', error);
      return false;
    }
  }

  /**
   * Clear admin session (logout)
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): AdminSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionData) return null;

      return JSON.parse(sessionData);
    } catch (error) {
      return null;
    }
  }
}
