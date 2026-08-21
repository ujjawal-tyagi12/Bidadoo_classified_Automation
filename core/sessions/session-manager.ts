import type { Browser, BrowserContextOptions } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import { UserSession } from "./user-session.js";
import { DuplicateSessionError, SessionNotFoundError } from "./session-errors.js";

export type SessionManagerOptions = {
  logger?: TestLogger;
  defaultContextOptions?: BrowserContextOptions;
};

/**
 * Named {@link UserSession} slots for one Playwright test. Map-based; prefer explicit names in steps.
 * Always call {@link disposeAll} in fixture teardown (handled by session fixture).
 */
export class SessionManager {
  private readonly sessions = new Map<string, UserSession>();
  private readonly logger?: TestLogger;
  private readonly defaultContextOptions?: BrowserContextOptions;

  constructor(options: SessionManagerOptions = {}) {
    this.logger = options.logger;
    this.defaultContextOptions = options.defaultContextOptions;
  }

  /**
   * Create a named session and launch browser context + page.
   * @throws DuplicateSessionError if name already exists
   */
  async create(name: string, browser: Browser, contextOptions?: BrowserContextOptions): Promise<UserSession> {
    if (this.sessions.has(name)) {
      throw new DuplicateSessionError(name);
    }
    const session = new UserSession(name, this.logger);
    await session.launch(browser, contextOptions ?? this.defaultContextOptions);
    this.sessions.set(name, session);
    return session;
  }

  /**
   * Get existing session or undefined.
   */
  get(name: string): UserSession | undefined {
    return this.sessions.get(name);
  }

  /**
   * @throws SessionNotFoundError if missing
   */
  require(name: string): UserSession {
    const s = this.sessions.get(name);
    if (!s) throw new SessionNotFoundError(name);
    return s;
  }

  has(name: string): boolean {
    return this.sessions.has(name);
  }

  /** All registered session names (in insertion order). */
  names(): string[] {
    return [...this.sessions.keys()];
  }

  /**
   * Dispose one session and remove it from the manager.
   */
  async dispose(name: string): Promise<void> {
    const s = this.sessions.get(name);
    if (!s) return;
    await s.dispose();
    this.sessions.delete(name);
  }

  /**
   * Dispose every session and clear the map.
   */
  async disposeAll(): Promise<void> {
    const names = this.names();
    for (const n of names) {
      await this.dispose(n);
    }
  }
}
