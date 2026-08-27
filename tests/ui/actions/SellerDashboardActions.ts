import type { Page } from "@playwright/test";
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

  async searchListings(query: string): Promise<void> {
    await this.dashboard.searchInput.fill(query);
  }

  async assertListingVisible(title: string): Promise<void> {
    await this.dashboard.listingRowByTitle(title).expect.toBeVisible();
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
