import { expect, type Page } from "@playwright/test";
import { WaitHelper } from "@core/ui/wait/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { SearchResultsPage, FAVORITE_MOCK_FAILURE_MESSAGE } from "../pages/SearchResultsPage.js";
import { EquipmentDetailPage } from "../pages/EquipmentDetailPage.js";
import { LoginModalPage } from "../pages/LoginModalPage.js";
import { ENDPOINTS } from "../../api/restful/endpoints.js";

type FavoriteIconState = "OUTLINE" | "FILLED";

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

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.results = new SearchResultsPage(page, deps.uiSurface);
    this.detail = new EquipmentDetailPage(page, deps.uiSurface);
    this.loginModal = new LoginModalPage(page, deps.uiSurface);
    this.wait = new WaitHelper(page);
  }

  // --- Listing-card surface (TC1, TC2, TC7-10, TC35, TC36) ---

  private async listingFavoriteState(index: number): Promise<FavoriteIconState> {
    const src = await this.results.favoriteIcon(index).attribute("src");
    return src?.includes("star-filled") ? "FILLED" : "OUTLINE";
  }

  /**
   * TC10 — rapid clicks are real toggles (requirements doc §3), so there is
   * no single expected end state to assert. This instead confirms the app
   * settled into a real, recognized icon state (not a broken/blank one)
   * after the dust settles, proving the rapid clicks didn't crash it.
   */
  async assertListingFavoriteSettledToRecognizedState(index = 0): Promise<void> {
    await this.wait.waitForCondition(async () => {
      const src = await this.results.favoriteIcon(index).attribute("src");
      return src?.includes("star-filled") || src?.includes("star-outline") || false;
    });
  }

  async clickListingFavorite(index = 0): Promise<void> {
    await this.results.favoriteButton(index).click();
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
  async ensureListingFavoriteState(desired: FavoriteIconState, index = 0): Promise<void> {
    if ((await this.listingFavoriteState(index)) !== desired) {
      await this.clickListingFavorite(index);
      await this.wait.waitForCondition(async () => (await this.listingFavoriteState(index)) === desired);
    }
  }

  async assertListingFavoriteFilled(index = 0): Promise<void> {
    await this.wait.waitForCondition(async () => (await this.listingFavoriteState(index)) === "FILLED");
  }

  async assertListingFavoriteOutline(index = 0): Promise<void> {
    await this.wait.waitForCondition(async () => (await this.listingFavoriteState(index)) === "OUTLINE");
  }

  /** TC10 — rapid re-clicks are real toggles; this only asserts the app survives them in a consistent, readable state. */
  async clickListingFavoriteRapidly(times: number, index = 0): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.results.favoriteButton(index).click();
    }
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
  async assertListingFavoritePersistedAfterFreshLogin(index = 0): Promise<void> {
    expect(await this.listingFavoriteState(index), "Favorite icon state after a fresh login session").toBe(
      "FILLED",
    );
  }
}
