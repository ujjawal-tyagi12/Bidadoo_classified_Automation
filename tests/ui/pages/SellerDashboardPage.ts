import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

export class SellerDashboardPage extends BasePage {
  get listingsTab() {
    // Accessible name is "Listings Listings" (icon alt text + label paragraph
    // both feed the button's accessible name) — match without `exact` so the
    // substring still matches, and it's specific enough not to collide with
    // any other tab (Dashboard, Brand Info, Security, ...).
    return surfaceLocator("Listings tab")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Listings" }))
      .build(this.page, this.surface);
  }

  get newListingButton() {
    return surfaceLocator("New Listing button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /new listing/i }))
      .build(this.page, this.surface);
  }

  /**
   * Clicking this reveals a dropdown menu (Upload CSV / View Logs / Download
   * Sample CSV / Download Categories) in place — it does not navigate, and
   * there is no "Single Listing" mode to return to from within it (the real
   * app has two parallel entry points, not a stateful toggle — see TC30).
   */
  get bulkUploadButton() {
    return surfaceLocator("Bulk Upload button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /bulk upload/i }))
      .build(this.page, this.surface);
  }

  bulkUploadMenuItem(label: string) {
    return surfaceLocator(`Bulk Upload menu item: ${label}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  get listingManagementHeading() {
    return surfaceLocator("Listing Management heading")
      .desktop((p) => p.getByText("Listing Management", { exact: true }))
      .build(this.page, this.surface);
  }

  get searchInput() {
    return surfaceLocator("Listing search input")
      .asTextInput()
      .desktop((p) => p.getByPlaceholder("Search for equipment...."))
      .build(this.page, this.surface);
  }

  /** `.first()` so repeated test runs that accumulate same-titled rows never hit a strict-mode ambiguity. */
  listingRowByTitle(title: string) {
    return surfaceLocator(`Listing row: ${title}`)
      .desktop((p) => p.locator("table tbody tr", { hasText: title }).first())
      .build(this.page, this.surface);
  }
}
