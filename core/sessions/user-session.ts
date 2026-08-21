import type { Browser, BrowserContext, BrowserContextOptions, Page } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import { SessionSharedStateImpl, type SessionSharedState } from "./session-shared-state.js";
import { SessionNotLaunchedError } from "./session-errors.js";

function prefixLogger(logger: TestLogger | undefined, tag: string): TestLogger | undefined {
  if (!logger) return undefined;
  const p = `[session:${tag}] `;
  return {
    info: (m) => logger.info(p + m),
    warn: (m) => logger.warn(p + m),
    error: (m) => logger.error(p + m),
    attachText: logger.attachText,
    flush: logger.flush,
  };
}

/**
 * One named browser context + page + per-session shared data.
 * Teardown: call {@link dispose} or let {@link SessionManager.disposeAll} run.
 */
export class UserSession {
  private readonly _shared = new SessionSharedStateImpl();

  get shared(): SessionSharedState {
    return this._shared;
  }

  private _context: BrowserContext | undefined;
  private _page: Page | undefined;
  private _launchOptions: BrowserContextOptions | undefined;
  private readonly log: TestLogger | undefined;

  constructor(
    readonly name: string,
    logger?: TestLogger,
  ) {
    this.log = prefixLogger(logger, name);
  }

  get context(): BrowserContext {
    if (!this._context) throw new SessionNotLaunchedError(this.name);
    return this._context;
  }

  get page(): Page {
    if (!this._page) throw new SessionNotLaunchedError(this.name);
    return this._page;
  }

  /** True after {@link launch} until {@link dispose}. */
  isLaunched(): boolean {
    return this._context !== undefined;
  }

  /**
   * Creates BrowserContext + Page. Throws if already launched.
   */
  async launch(browser: Browser, options?: BrowserContextOptions): Promise<void> {
    if (this._context) {
      throw new Error(`Session "${this.name}" is already launched. Call dispose() or recreate() first.`);
    }
    this.log?.info("Launching BrowserContext");
    const effectiveOptions = options ?? this._launchOptions;
    this._context = await browser.newContext(effectiveOptions);
    this._page = await this._context.newPage();
    this._launchOptions = effectiveOptions;
    this.log?.info("BrowserContext ready");
  }

  /**
   * Closes context (cookies/storage), clears {@link shared}, drops page references.
   */
  async dispose(): Promise<void> {
    this.log?.info("Disposing BrowserContext");
    this._shared.clear();
    if (this._context) {
      await this._context.close().catch(() => undefined);
    }
    this._context = undefined;
    this._page = undefined;
  }

  /**
   * Full teardown then launch again (e.g. simulate app kill / new install).
   */
  async recreate(browser: Browser, options?: BrowserContextOptions): Promise<void> {
    await this.dispose();
    await this.launch(browser, options);
  }
}
