import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/** The Listings tab's table + filter panel (BIDC-279) — tab nav and search stay on `SellerDashboardPage`. */
export class ListingsPage extends BasePage {
  private get filterDialog() {
    return this.page.getByRole("dialog").filter({ hasText: "FILTER" });
  }

  private get dateCalendarDialog() {
    return this.page.getByRole("dialog", { name: "Choose Date" });
  }

  /** Visibility check for the calendar popup, used by the retry in `openDateCalendar`. */
  get dateCalendarPopup() {
    return surfaceLocator("Date calendar popup")
      .desktop(() => this.dateCalendarDialog)
      .build(this.page, this.surface);
  }

  get filterButton() {
    return surfaceLocator("Filter button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /^filter/i }))
      .build(this.page, this.surface);
  }

  get filterApplyButton() {
    return surfaceLocator("Filter Apply button")
      .asButton()
      .desktop(() => this.filterDialog.getByRole("button", { name: "Apply" }))
      .build(this.page, this.surface);
  }

  get filterCancelButton() {
    return surfaceLocator("Filter Cancel button")
      .asButton()
      .desktop(() => this.filterDialog.getByRole("button", { name: "Cancel" }))
      .build(this.page, this.surface);
  }

  get filterClearAllButton() {
    return surfaceLocator("Filter Clear all button")
      .asButton()
      .desktop(() => this.filterDialog.getByRole("button", { name: "Clear all" }))
      .build(this.page, this.surface);
  }

  /** A `div[role='button']`, not a real button — targeted structurally since its name changes after selection. */
  get statusFilterDropdown() {
    return surfaceLocator("Status filter dropdown")
      .asButton()
      .desktop(() => this.filterDialog.locator("div[role='button']"))
      .build(this.page, this.surface);
  }

  statusFilterOption(label: string) {
    return surfaceLocator(`Status filter option: ${label}`)
      .asButton()
      .desktop(() => this.filterDialog.getByRole("option", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  /** Native `<input type="range">` — confirmed live that `.fill()` sets it correctly (React-controlled, but a real input). */
  get priceFilterMinSlider() {
    return surfaceLocator("Price filter minimum slider")
      .asTextInput()
      .desktop(() => this.filterDialog.locator("input[type='range']").nth(0))
      .build(this.page, this.surface);
  }

  get priceFilterMaxSlider() {
    return surfaceLocator("Price filter maximum slider")
      .asTextInput()
      .desktop(() => this.filterDialog.locator("input[type='range']").nth(1))
      .build(this.page, this.surface);
  }

  /** Targets the `<p>` wrapping "Price: $X - $Y" — `getByText(/^Price:/)` used to match only the label span. */
  get priceFilterRangeText() {
    return surfaceLocator("Price filter range text")
      .desktop(() => this.filterDialog.locator("p").filter({ hasText: "Price:" }))
      .build(this.page, this.surface);
  }

  get dateFromInput() {
    return surfaceLocator("Listed On From input")
      .asTextInput()
      .desktop(() => this.filterDialog.getByRole("textbox").nth(0))
      .build(this.page, this.surface);
  }

  get dateFromCalendarButton() {
    return surfaceLocator("Listed On From calendar button")
      .asButton()
      .desktop(() => this.filterDialog.getByRole("button", { name: "Open calendar" }).nth(0))
      .build(this.page, this.surface);
  }

  get dateToInput() {
    return surfaceLocator("Listed On To input")
      .asTextInput()
      .desktop(() => this.filterDialog.getByRole("textbox").nth(1))
      .build(this.page, this.surface);
  }

  get dateToCalendarButton() {
    return surfaceLocator("Listed On To calendar button")
      .asButton()
      .desktop(() => this.filterDialog.getByRole("button", { name: "Open calendar" }).nth(1))
      .build(this.page, this.surface);
  }

  /** `accessibleName` must match the calendar's real accessible name exactly, e.g. "Choose Wednesday, August 20th, 2026" — see `buildCalendarDayName` in ListingsActions. */
  calendarDay(accessibleName: string) {
    return surfaceLocator(`Calendar day: ${accessibleName}`)
      .asButton()
      .desktop(() => this.dateCalendarDialog.getByRole("gridcell", { name: accessibleName }))
      .build(this.page, this.surface);
  }

  // --- Table ---

  get table() {
    return surfaceLocator("Listings table")
      .desktop((p) => p.getByRole("table"))
      .build(this.page, this.surface);
  }

  columnHeader(name: string) {
    return surfaceLocator(`Column header: ${name}`)
      .desktop((p) => p.getByRole("columnheader", { name, exact: true }))
      .build(this.page, this.surface);
  }

  get priceSortButton() {
    return surfaceLocator("Price sort button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Price Sort" }))
      .build(this.page, this.surface);
  }

  get updatedDateSortButton() {
    return surfaceLocator("Updated Date sort button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Updated Date Sort" }))
      .build(this.page, this.surface);
  }

  /** `.first()` so repeated runs that accumulate same-titled rows never hit a strict-mode ambiguity — same convention as `SellerDashboardPage.listingRowByTitle`. */
  private rowByTitle(title: string) {
    return this.page.locator("table tbody tr", { hasText: title }).first();
  }

  /** Real `<input>` is `sr-only` with no `<label>` — read-only here, use `rowCheckboxToggle` to click. */
  rowCheckbox(title: string) {
    return surfaceLocator(`Row checkbox: ${title}`)
      .asCheckbox()
      .desktop(() => this.rowByTitle(title).locator("input[type='checkbox']"))
      .build(this.page, this.surface);
  }

  /** The clickable target for a row's checkbox — the visible `<td>` cell itself, confirmed live. */
  rowCheckboxToggle(title: string) {
    return surfaceLocator(`Row checkbox cell: ${title}`)
      .asButton()
      .desktop(() => this.rowByTitle(title).locator("td").first())
      .build(this.page, this.surface);
  }

  rowStatusCell(title: string) {
    return surfaceLocator(`Row status: ${title}`)
      .desktop(() => this.rowByTitle(title).locator("td").nth(6))
      .build(this.page, this.surface);
  }

  rowPriceCell(title: string) {
    return surfaceLocator(`Row price: ${title}`)
      .desktop(() => this.rowByTitle(title).locator("td").nth(4))
      .build(this.page, this.surface);
  }

  /**
   * Confirmed live (BIDC-298 §9): only Active rows have this — the status cell is
   * itself a trigger that reveals a single "Expired" option. Draft rows just show
   * static text (no trigger, no options) — the `/^Active/i` name keeps this from
   * ever matching the "Expired" option once the list opens.
   */
  rowStatusTrigger(title: string) {
    return surfaceLocator(`Row status trigger: ${title}`)
      .asButton()
      .desktop(() => this.rowByTitle(title).locator("td").nth(6).getByRole("button", { name: /^Active/i }))
      .build(this.page, this.surface);
  }

  rowStatusOption(title: string, status: string) {
    return surfaceLocator(`Row status option: ${title} → ${status}`)
      .asButton()
      .desktop(() => this.rowByTitle(title).locator("td").nth(6).getByRole("button", { name: status, exact: true }))
      .build(this.page, this.surface);
  }

  rowActionMenuButton(title: string) {
    return surfaceLocator(`Row action menu button: ${title}`)
      .asButton()
      .desktop(() => this.rowByTitle(title).getByRole("button").last())
      .build(this.page, this.surface);
  }

  rowActionMenu(title: string) {
    return surfaceLocator(`Row action menu: ${title}`)
      .desktop(() => this.rowByTitle(title).getByRole("menu"))
      .build(this.page, this.surface);
  }

  rowActionMenuItem(title: string, label: string) {
    return surfaceLocator(`Row action menu item: ${title} → ${label}`)
      .asButton()
      .desktop(() => this.rowByTitle(title).getByRole("menu").getByRole("button", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  get bulkSellWithBidadooButton() {
    return surfaceLocator("Bulk Sell with bidadoo button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Sell with bidadoo" }))
      .build(this.page, this.surface);
  }

  get sellConfirmationDialog() {
    return surfaceLocator("Sell with bidadoo confirmation dialog")
      .desktop((p) => p.getByRole("dialog").filter({ hasText: "Ready to Sell with bidadoo?" }))
      .build(this.page, this.surface);
  }

  get sellConfirmationCancelButton() {
    return surfaceLocator("Sell confirmation Cancel button")
      .asButton()
      .desktop((p) =>
        p.getByRole("dialog").filter({ hasText: "Ready to Sell with bidadoo?" }).getByRole("button", { name: "Cancel" }),
      )
      .build(this.page, this.surface);
  }

  get emptyStateMessage() {
    return surfaceLocator("Empty listings message")
      .desktop((p) => p.getByText(/no equipments? found/i))
      .build(this.page, this.surface);
  }

  get paginationSummary() {
    return surfaceLocator("Pagination summary")
      .desktop((p) => p.getByText(/^Showing /))
      .build(this.page, this.surface);
  }

  /** The only `<select>` on this page — confirmed live, safe to target unscoped. */
  get rowsPerPageDropdown() {
    return surfaceLocator("Rows per page dropdown")
      .asDropdown()
      .desktop((p) => p.getByRole("combobox"))
      .build(this.page, this.surface);
  }

  referenceIdLink(title: string) {
    return surfaceLocator(`Reference ID link: ${title}`)
      .asButton()
      .desktop(() => this.rowByTitle(title).getByRole("link"))
      .build(this.page, this.surface);
  }
}
