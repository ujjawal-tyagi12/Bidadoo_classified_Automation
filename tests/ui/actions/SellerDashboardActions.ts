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
   * positionally stable first — not an arbitrary sleep — reliably clears the
   * race window (confirmed live: <500ms is flaky, ~630ms is reliable 7/7).
   */
  async startNewListing(): Promise<void> {
    await this.wait.waitForElementStable(this.dashboard.newListingButton, { interval: 600 });
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

  /** Searches for and confirms the listing created earlier in this scenario, by its generated title. */
  async assertGeneratedListingVisible(): Promise<void> {
    const { validAssetInformation } = await this.getEquipmentProps();
    await this.searchListings(validAssetInformation.title);
    await this.assertListingVisible(validAssetInformation.title);
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
