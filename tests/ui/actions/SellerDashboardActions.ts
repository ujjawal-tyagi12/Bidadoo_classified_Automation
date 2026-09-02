import type { Page } from "@playwright/test";
import type { CreateEquipmentProps } from "@data/props/index.js";
import { getOrCreateEquipmentProps } from "@data/factories/create-equipment.factory.js";
import type { ActionDeps } from "../support/action-deps.js";
import { SellerDashboardPage } from "../pages/SellerDashboardPage.js";
import { WaitHelper } from "@core/ui/wait/index.js";

export class SellerDashboardActions {
  private readonly dashboard: SellerDashboardPage;
  private readonly wait: WaitHelper;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.dashboard = new SellerDashboardPage(page, deps.uiSurface);
    this.wait = new WaitHelper(page);
  }

  /** Generated once per scenario and cached on `state` — see `getOrCreateEquipmentProps`. */
  async getEquipmentProps(): Promise<CreateEquipmentProps> {
    return getOrCreateEquipmentProps(this.deps.state, { request: this.deps.request, logger: this.deps.logger });
  }

  async openListingsTab(): Promise<void> {
    await this.dashboard.listingsTab.click();
    await this.dashboard.listingManagementHeading.expect.toBeVisible();
  }

  /**
   * Clicking New Listing the instant it appears after switching to the Listings
   * tab races the app's router: two client-side navigations back-to-back can
   * leave the page frozen on the previous view even though the URL updates
   * (real app bug, see docs/requirements §2b). Waiting for the button to be
   * positionally stable first — not an arbitrary sleep — clears the race
   * window; the 600ms interval documented as "reliable 7/7" still hit the
   * frozen-page state on a later full-suite headed run, so this uses the
   * doc's own more conservative ~1s finding ("with a ~1 second pause...
   * renders correctly 3/3 runs") for a larger safety margin against the
   * underlying (still-real, app-side) race.
   */
  async startNewListing(): Promise<void> {
    await this.wait.waitForElementStable(this.dashboard.newListingButton, { interval: 1000 });
    await this.dashboard.newListingButton.click();
  }

  async startBulkUpload(): Promise<void> {
    await this.dashboard.bulkUploadButton.click();
  }

  /**
   * Confirmed live: this app's search cancels whatever request is still in
   * flight whenever a new one fires, and its abort-handling is broken — a
   * cancelled request renders the literal text "signal is aborted without
   * reason" into the results area instead of either a loading state or the
   * real result (confirmed live, same defect documented for the Listings
   * search box — see requirements doc §2b). This isn't limited to repeated
   * searches: it also fires on the very first search, whenever the caller
   * lands here fresh off a navigation whose own initial (unfiltered) fetch
   * is still in flight — firing the search immediately cancels that request
   * and trips the same broken abort-handling. Waiting for the table's own
   * "Showing X-Y" summary first confirms that initial fetch has actually
   * resolved before searching, so the search's own request is never racing
   * one already in flight.
   */
  async searchListings(query: string): Promise<void> {
    await this.dashboard.paginationSummary.expect.toBeVisible();
    await this.dashboard.searchInput.fill(query);
  }

  async assertListingVisible(title: string, options?: { timeout?: number }): Promise<void> {
    await this.dashboard.listingRowByTitle(title).expect.toBeVisible(options);
  }

  /**
   * Confirmed live: a freshly created/published listing can take a beat to
   * become searchable server-side — the search query fires once, and if it
   * lands before the backend finishes indexing, the table just stays on that
   * (empty) result until something re-queries. An earlier version of this
   * method retried by re-calling `searchListings` in a loop — that only made
   * things worse, since each retry's new search cancels the previous one and
   * trips the same abort-handling defect `searchListings` now guards against
   * on every call. Searching once and giving Playwright's own polling a
   * single, longer window to wait out any remaining indexing lag is what
   * actually resolves it; the caller marks its test `slow()` (tripling the
   * timeout to 120s) to give this real room.
   *
   * Takes the search term and the expected row text separately — some
   * callers search on one string but the row displays a different one (e.g.
   * a sanitized/safe search term vs. the real special-characters name, or
   * the full name typed vs. its table-truncated display form). Defaults to
   * the same string for both when the caller has just one.
   */
  async searchAndAssertListingVisible(searchTerm: string, expectedRowText: string = searchTerm): Promise<void> {
    await this.searchListings(searchTerm);
    await this.assertListingVisible(expectedRowText, { timeout: 60000 });
  }

  /** Searches for and confirms the listing created earlier in this scenario, by its generated title. */
  async assertGeneratedListingVisible(): Promise<void> {
    const { validAssetInformation } = await this.getEquipmentProps();
    await this.searchAndAssertListingVisible(validAssetInformation.title);
  }

  async assertNewListingAndBulkUploadActionsVisible(): Promise<void> {
    await this.dashboard.newListingButton.expect.toBeVisible();
    await this.dashboard.bulkUploadButton.expect.toBeVisible();
  }

  async assertBulkUploadMenuOptionsVisible(): Promise<void> {
    await this.dashboard.bulkUploadMenuItem("Upload CSV").expect.toBeVisible();
    await this.dashboard.bulkUploadMenuItem("View Logs").expect.toBeVisible();
    await this.dashboard.bulkUploadMenuItem("Download Sample CSV").expect.toBeVisible();
    await this.dashboard.bulkUploadMenuItem("Download Categories").expect.toBeVisible();
  }
}
