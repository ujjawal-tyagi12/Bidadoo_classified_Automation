import { expect, test, type Page } from "@playwright/test";
import { WaitHelper } from "@core/ui/wait/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { SearchResultsPage, FAVORITE_MOCK_FAILURE_MESSAGE } from "../pages/SearchResultsPage.js";
import { EquipmentDetailPage } from "../pages/EquipmentDetailPage.js";
import { LoginModalPage } from "../pages/LoginModalPage.js";
import { ENDPOINTS } from "../../api/restful/endpoints.js";
import { AuthApiClient } from "../../api/restful/clients/auth.client.js";
import { EquipmentSearchClient } from "../../api/restful/clients/equipment-search.client.js";

type FavoriteIconState = "OUTLINE" | "FILLED";

const FAVORITABLE_RESULT_TITLE_KEY = "favoritableResultTitle";
const FAVORITABLE_CANDIDATE_TITLES_KEY = "favoritableCandidateTitles";

/**
 * Favorite icon on the `/search` result cards and the equipment detail
 * page, plus the shared "Welcome Back" sign-in modal it triggers for a
 * signed-out visitor. See
 * docs/requirements/equipment-favorite-automation-requirements.md for the
 * live findings behind every assertion below.
 */
export class FavoriteActions {
  private readonly results: SearchResultsPage;
  private readonly detail: EquipmentDetailPage;
  private readonly loginModal: LoginModalPage;
  private readonly wait: WaitHelper;
  private readonly authApiClient: AuthApiClient;
  private readonly equipmentSearchClient: EquipmentSearchClient;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.results = new SearchResultsPage(page, deps.uiSurface);
    this.detail = new EquipmentDetailPage(page, deps.uiSurface);
    this.loginModal = new LoginModalPage(page, deps.uiSurface);
    this.wait = new WaitHelper(page);
    // page.request (not the top-level `request` fixture) shares this browser context's
    // cookies — required for the session-lookup call inside getFavoritableResult() below.
    this.authApiClient = new AuthApiClient({ request: page.request, logger: deps.logger });
    this.equipmentSearchClient = new EquipmentSearchClient({ request: deps.request, logger: deps.logger });
  }

  // --- Listing-card surface (TC1, TC2, TC7-10, TC35, TC36) ---

  /**
   * Confirmed live: this app correctly refuses to favorite the current
   * account's own listing — the detail page even labels the button
   * "Favorite disabled for own listing" — but the listing-card version of
   * the same button gives no such signal: it's fully enabled and clickable,
   * it just silently sends no request. Since `/search`'s default sort
   * surfaces the most-recently-created equipment first, and this shared QA
   * account is also the one every other module's tests use to create
   * equipment, the first result is reliably this account's own listing —
   * not a representative "someone else's listing" case at all.
   *
   * Resolves the title of the first rendered result that is genuinely owned
   * by a different account, by cross-referencing the real, live search
   * API's `seller` field against this session's own account id (from
   * `AuthApiClient.getCurrentAccountId()`) — not a UI-badge heuristic like
   * "not Recently Added", which isn't an authoritative ownership signal.
   * Cached per scenario via `state`, same pattern as `getOrCreateEquipmentProps`.
   *
   * Returns a title, not an index: confirmed live that favoriting/unfavoriting
   * a card can itself change the "Recommended" sort order, so an index
   * resolved once can silently point at a different card after the very
   * toggle a scenario just performed. Every listing-card locator below is
   * title-scoped (`favoriteButtonForExactTitle`/`favoriteIconForExactTitle`)
   * so a reorder never breaks which card gets interacted with.
   *
   * `playwright.config.ts` runs `workers: 3` scenarios in parallel against
   * this same shared QA account — confirmed live that always picking the
   * *first* eligible item made concurrent scenarios race to toggle the same
   * real backend record. Indexing into the eligible pool by
   * `test.info().parallelIndex` gives each concurrently-running worker a
   * distinct item instead, so their favorite toggles can never collide —
   * sorted by `_id` (stable and immutable) before indexing, since the
   * "Recommended" order it's queried in can itself drift between two
   * workers' calls (favoriting is confirmed live to be able to reorder it),
   * which previously let two different `parallelIndex` values still land on
   * the same title if the pool reshuffled between their requests.
   *
   * For a signed-out visitor there is no owning account to avoid — every
   * click opens the sign-in modal regardless of which item it targets — so
   * this falls back to the first result without filtering.
   *
   * Returns several ordered candidates, not just one: confirmed live (see
   * `SearchResultsActions.openResultDetail`, the same defensive pattern)
   * that a "Recommended" result can be a since-expired listing whose detail
   * page reads "no longer open for inquiries or purchase" instead of real
   * content — `openFavoritableResultDetailPage` below falls back through
   * these candidates rather than failing the whole scenario on whichever
   * one happens to be expired right now.
   */
  private async getFavoritableCandidateTitles(): Promise<string[]> {
    const cached = this.deps.state.getSharedData<string[]>(FAVORITABLE_CANDIDATE_TITLES_KEY);
    if (cached !== undefined) {
      return cached;
    }
    const accountId = await this.authApiClient.getCurrentAccountId();
    const response = await this.equipmentSearchClient.searchEquipments({ page: 1, limit: 100, sortBy: "Recommended" });
    const items = response.data.result.data;
    const eligible = accountId === null
      ? items.slice(0, 1)
      : items.filter((candidate) => candidate.seller !== accountId).sort((a, b) => a._id.localeCompare(b._id));
    if (eligible.length === 0) {
      throw new Error(
        "getFavoritableCandidateTitles: every one of the first 100 search results is owned by the current account — no favoritable item found",
      );
    }
    const { parallelIndex } = test.info();
    const candidateCount = Math.min(eligible.length, 5);
    const candidates = Array.from(
      new Set(
        Array.from(
          { length: candidateCount },
          (_, i) => eligible[(parallelIndex + i) % eligible.length]!.information.title,
        ),
      ),
    );
    this.deps.state.setSharedData(FAVORITABLE_CANDIDATE_TITLES_KEY, candidates);
    return candidates;
  }

  /** The single title listing-card interactions target — the first candidate from `getFavoritableCandidateTitles`, cached separately since a card (unlike a detail page) never shows an "expired" state to fall back from. */
  private async getFavoritableResultTitle(): Promise<string> {
    const cachedTitle = this.deps.state.getSharedData<string>(FAVORITABLE_RESULT_TITLE_KEY);
    if (cachedTitle !== undefined) {
      return cachedTitle;
    }
    const [title] = await this.getFavoritableCandidateTitles();
    this.deps.state.setSharedData(FAVORITABLE_RESULT_TITLE_KEY, title);
    return title!;
  }

  /**
   * This account owns enough equipment now (see `getFavoritableCandidateTitles`)
   * that a genuinely non-owned item is often past the default "Recommended"
   * page's first 10 cards — so resolving its title isn't enough on its own;
   * the card also has to actually be rendered on whatever page the caller is
   * currently on. Confirms it's visible and, if not, filters `/search` down
   * to that exact title (same URL-search mechanism as
   * `SearchResultsActions.openResultDetailByExactTitle`), which also makes
   * this immune to "Recommended" reordering after a favorite toggle.
   */
  private async ensureCardVisibleForTitle(title: string): Promise<void> {
    if (!(await this.results.favoriteIconForExactTitle(title).isVisible())) {
      await this.deps.nav.goto(`/search?searchText=${encodeURIComponent(title)}`);
      await this.results.resultsHeaderCount.waitForVisible();
    }
  }

  private async resolveFavoritableCard(): Promise<string> {
    const title = await this.getFavoritableResultTitle();
    await this.ensureCardVisibleForTitle(title);
    return title;
  }

  private async listingFavoriteState(title: string): Promise<FavoriteIconState> {
    const src = await this.results.favoriteIconForExactTitle(title).attribute("src");
    return src?.includes("star-filled") ? "FILLED" : "OUTLINE";
  }

  /**
   * TC10 — rapid clicks are real toggles (requirements doc §3), so there is
   * no single expected end state to assert. This instead confirms the app
   * settled into a real, recognized icon state (not a broken/blank one)
   * after the dust settles, proving the rapid clicks didn't crash it.
   */
  async assertListingFavoriteSettledToRecognizedState(): Promise<void> {
    const title = await this.resolveFavoritableCard();
    await this.wait.waitForCondition(async () => {
      const src = await this.results.favoriteIconForExactTitle(title).attribute("src");
      return src?.includes("star-filled") || src?.includes("star-outline") || false;
    });
  }

  async clickListingFavorite(): Promise<void> {
    const title = await this.resolveFavoritableCard();
    await this.results.favoriteButtonForExactTitle(title).click();
  }

  /**
   * Confirmed live (see requirements doc §3): this app's own account state
   * persists across runs, so a scenario asserting a specific transition
   * must first put the icon in the opposite starting state — otherwise a
   * re-run beginning already-favorited would toggle the wrong direction.
   *
   * Only call this while signed in. A signed-out click never toggles — it
   * opens the sign-in modal instead — so this would hang waiting for a
   * state change that can never happen.
   */
  async ensureListingFavoriteState(desired: FavoriteIconState): Promise<void> {
    const title = await this.resolveFavoritableCard();
    if ((await this.listingFavoriteState(title)) !== desired) {
      await this.clickListingFavorite();
      await this.wait.waitForCondition(async () => (await this.listingFavoriteState(title)) === desired);
    }
  }

  async assertListingFavoriteFilled(): Promise<void> {
    const title = await this.resolveFavoritableCard();
    await this.wait.waitForCondition(async () => (await this.listingFavoriteState(title)) === "FILLED");
  }

  async assertListingFavoriteOutline(): Promise<void> {
    const title = await this.resolveFavoritableCard();
    await this.wait.waitForCondition(async () => (await this.listingFavoriteState(title)) === "OUTLINE");
  }

  /** TC10 — rapid re-clicks are real toggles; this only asserts the app survives them in a consistent, readable state. */
  async clickListingFavoriteRapidly(times: number): Promise<void> {
    const title = await this.resolveFavoritableCard();
    for (let i = 0; i < times; i++) {
      await this.results.favoriteButtonForExactTitle(title).click();
    }
  }

  /**
   * Opens the detail page of a non-self-owned result, by real title —
   * mirrors `SearchResultsActions.openResultDetailByExactTitle`, plus one
   * more defensive step: confirmed live that the resolved candidate can
   * land on an expired listing's detail page (no favorite button at all),
   * so this falls back through `getFavoritableCandidateTitles`' further
   * candidates — same pattern as `SearchResultsActions.openResultDetail` —
   * instead of failing the whole scenario on that one candidate.
   */
  async openFavoritableResultDetailPage(): Promise<void> {
    const candidates = await this.getFavoritableCandidateTitles();
    for (const title of candidates) {
      await this.ensureCardVisibleForTitle(title);
      await this.results.viewDetailsButtonForExactTitle(title).click();
      await this.deps.nav.waitForURL(/\/search\/[a-f0-9]{24}/i);
      try {
        await this.detail.breadcrumb.waitForVisible({ timeout: 8000 });
        this.deps.state.setSharedData(FAVORITABLE_RESULT_TITLE_KEY, title);
        return;
      } catch {
        await this.deps.nav.goto("/search");
        await this.results.resultsHeaderCount.waitForVisible();
      }
    }
    throw new Error(
      "openFavoritableResultDetailPage: could not reach a non-expired favoritable listing among the candidate titles",
    );
  }

  // --- Detail-page surface (TC1/TC2 web-vs-detail coverage) ---

  private async detailFavoriteState(): Promise<FavoriteIconState> {
    const src = await this.detail.favoriteIcon.attribute("src");
    return src?.includes("star-filled") ? "FILLED" : "OUTLINE";
  }

  async clickDetailFavorite(): Promise<void> {
    await this.detail.favoriteButton.click();
  }

  async assertDetailFavoriteFilled(): Promise<void> {
    await this.wait.waitForCondition(async () => (await this.detailFavoriteState()) === "FILLED");
  }

  // --- Sign-in modal (TC2, TC3, TC14-17, TC23-27) ---

  async assertLoginModalVisible(): Promise<void> {
    await this.loginModal.dialog.expect.toBeVisible();
  }

  async assertLoginModalHidden(): Promise<void> {
    await this.loginModal.dialog.expect.toBeHidden();
  }

  /** TC2 — confirmed live: only the listing-card trigger mentions "favorites" in the subtitle. */
  async assertLoginModalPromptsForFavorite(): Promise<void> {
    await this.loginModal.subtitle.expect.toContainText("add this item to your favorites");
  }

  /** Detail-page trigger — confirmed live: generic copy, no "favorites" mention. */
  async assertLoginModalGenericSignInPrompt(): Promise<void> {
    await this.loginModal.subtitle.expect.toContainText("Sign In to your account");
  }

  async fillLoginEmail(email: string): Promise<void> {
    await this.loginModal.emailInput.fill(email);
  }

  async fillLoginPassword(password: string): Promise<void> {
    await this.loginModal.passwordInput.fill(password);
  }

  /** TC24/TC25 — confirmed live: no client-side max length on either field. */
  async fillLoginWithLongEmailAndPassword(): Promise<void> {
    const longEmail = `${"a".repeat(80)}@${"b".repeat(80)}.com`;
    const longPassword = `Aa1!${"x".repeat(150)}`;
    await this.loginModal.emailInput.fill(longEmail);
    await this.loginModal.passwordInput.fill(longPassword);
  }

  /** TC3, TC16, TC17 — real credentials submit and either succeed or surface a real server error. */
  async submitLogin(email: string, password: string): Promise<void> {
    await this.loginModal.emailInput.fill(email);
    await this.loginModal.passwordInput.fill(password);
    await this.loginModal.signInButton.click();
  }

  async assertSignInDisabled(): Promise<void> {
    await this.loginModal.signInButton.expect.toBeDisabled();
  }

  async assertSignInEnabled(): Promise<void> {
    await this.loginModal.signInButton.expect.toBeEnabled();
  }

  async assertInvalidEmailMessageVisible(): Promise<void> {
    await this.loginModal.invalidEmailMessage.expect.toBeVisible();
  }

  async assertShortPasswordMessageVisible(): Promise<void> {
    await this.loginModal.shortPasswordMessage.expect.toBeVisible();
  }

  /** TC16 — real message confirmed verbatim, including a genuine "attempts attempts" copy bug. */
  async assertIncorrectPasswordMessageVisible(): Promise<void> {
    await this.loginModal.incorrectPasswordMessage.expect.toBeVisible();
  }

  /** TC17 */
  async assertAccountNotFoundMessageVisible(): Promise<void> {
    await this.loginModal.accountNotFoundMessage.expect.toBeVisible();
  }

  // --- Session expiry (TC7) ---

  /**
   * Confirmed live: clearing cookies alone is not reliable — the app can
   * keep using an already-cached in-memory session on the current page
   * instance and complete a favorite toggle as if still authenticated. A
   * reload forces it to re-derive auth state from (now-absent) cookies,
   * which reliably re-prompts the sign-in modal on the next favorite click.
   */
  async simulateExpiredSession(): Promise<void> {
    await this.page.context().clearCookies();
    await this.deps.nav.reload();
    await this.results.resultsHeaderCount.waitForVisible();
  }

  // --- Mocked API failure (TC8) ---

  /** Confirmed live: the app surfaces this response body's `message` verbatim in a real toast; the icon stays unchanged. */
  async mockFavoriteToggleFailure(): Promise<void> {
    await this.page.route(`**${ENDPOINTS.addToFavoritesToggle}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ statusCode: 500, message: FAVORITE_MOCK_FAILURE_MESSAGE }),
      }),
    );
  }

  async assertFavoriteErrorToastVisible(): Promise<void> {
    await this.results.favoriteErrorToast.expect.toBeVisible();
  }

  // --- Cross-session persistence (TC36) ---

  /** TC36 — reads the server-persisted state directly, independent of whatever the icon showed in a prior page instance. */
  async assertListingFavoritePersistedAfterFreshLogin(): Promise<void> {
    const title = await this.resolveFavoritableCard();
    expect(await this.listingFavoriteState(title), "Favorite icon state after a fresh login session").toBe(
      "FILLED",
    );
  }
}
