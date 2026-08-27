import type { Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import type { Button } from "@core/ui";
import { ListingsPage } from "../pages/ListingsPage.js";

const ORDINAL_SUFFIX: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

/** Confirmed live: the Equipment Name column truncates rendered text to exactly 100 chars (no ellipsis). */
const TABLE_EQUIPMENT_NAME_TRUNCATION_LENGTH = 100;

export function truncateForTableDisplay(name: string): string {
  return name.slice(0, TABLE_EQUIPMENT_NAME_TRUNCATION_LENGTH);
}

/**
 * Confirmed live: the Listings search returns zero results for a query containing
 * special characters (`#`, `$`, `@`, `—`, etc.) even though the exact same title
 * renders fine in the table — searching by its leading plain word instead finds it,
 * since search itself isn't what this scenario is meant to verify.
 */
export function extractSafeSearchTerm(name: string): string {
  return name.split(" ")[0];
}

/** Calendar's real accessible name, e.g. "Choose Wednesday, August 20th, 2026" — disabled days use "Not available" instead of "Choose". */
function buildCalendarDayName(date: Date, verb: "Choose" | "Not available" = "Choose"): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const suffix = day >= 11 && day <= 13 ? "th" : (ORDINAL_SUFFIX[day % 10] ?? "th");
  return `${verb} ${weekday}, ${month} ${day}${suffix}, ${year}`;
}

export class ListingsActions {
  private readonly listings: ListingsPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.listings = new ListingsPage(page, deps.uiSurface);
  }

  // --- Table display ---

  async assertColumnsVisible(): Promise<void> {
    await this.listings.columnHeader("Reference ID").expect.toBeVisible();
    await this.listings.columnHeader("Equipment Name").expect.toBeVisible();
    await this.listings.columnHeader("Location").expect.toBeVisible();
    await this.listings.columnHeader("Status").expect.toBeVisible();
    await this.listings.columnHeader("Action").expect.toBeVisible();
    await this.listings.priceSortButton.expect.toBeVisible();
    await this.listings.updatedDateSortButton.expect.toBeVisible();
  }

  async assertPaginationSummaryVisible(): Promise<void> {
    await this.listings.paginationSummary.expect.toBeVisible();
  }

  /** Confirmed live (BIDC-298 §8): the Rows per pages control defaults to "10". */
  async assertDefaultPageSizeIsTen(): Promise<void> {
    await this.listings.rowsPerPageDropdown.expect.toHaveValue("10");
  }

  /** Confirmed live: shares the same click-registration unreliability as this app's toggles — verified against the URL actually navigating, retried if not. */
  async clickReferenceId(title: string): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        await this.listings.referenceIdLink(title).click();
        await this.deps.pageAssert.urlContains("view=", { timeout: isLastAttempt ? 6000 : 1500 });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  // --- Checkbox ---

  async toggleRowCheckbox(title: string): Promise<void> {
    await this.listings.rowCheckboxToggle(title).click();
  }

  async assertRowCheckboxChecked(title: string): Promise<void> {
    await this.listings.rowCheckbox(title).expect.toBeChecked();
  }

  async assertRowCheckboxDisabled(title: string): Promise<void> {
    await this.listings.rowCheckbox(title).expect.toBeDisabled();
  }

  async assertRowCheckboxEnabled(title: string): Promise<void> {
    await this.listings.rowCheckbox(title).expect.toBeEnabled();
  }

  async assertBulkSellWithBidadooButtonVisible(): Promise<void> {
    await this.listings.bulkSellWithBidadooButton.expect.toBeVisible();
  }

  // --- Status ---

  /**
   * Confirmed live (BIDC-298 §9): only Active listings have this trigger, and
   * "Expired" is its only option — applies instantly, no confirmation dialog.
   * Shares the same open/close race as the Status filter dropdown and row action
   * menu (see `filterByStatus`), so the same bounded retry applies here too.
   */
  async updateListingStatusToExpired(title: string): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        await this.listings.rowStatusTrigger(title).click();
        await this.listings.rowStatusOption(title, "Expired").click({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async assertRowStatusIs(title: string, status: string): Promise<void> {
    await this.listings.rowStatusCell(title).expect.toContainText(status);
  }

  async assertRowPriceIs(title: string, price: string): Promise<void> {
    const formatted = `$${Number(price).toLocaleString("en-US")}`;
    await this.listings.rowPriceCell(title).expect.toContainText(formatted);
  }

  // --- Action menu ---

  /** "More" can silently fail to open the menu (same race as `filterByStatus`) — retry until it's actually visible. */
  async openRowActionMenu(title: string): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.listings.rowActionMenuButton(title).click();
      const isLastAttempt = attempt === maxAttempts;
      try {
        await this.listings.rowActionMenu(title).expect.toBeVisible({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        break;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  /** Menu can close again right after opening (see `clickActionMenuItem`) — retry re-opens and re-checks. */
  async assertActionMenuItemVisible(title: string, label: string): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        if (attempt > 1) await this.openRowActionMenu(title);
        await this.listings.rowActionMenuItem(title, label).expect.toBeVisible({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async assertActionMenuItemNotVisible(title: string, label: string): Promise<void> {
    await this.listings.rowActionMenuItem(title, label).expect.not.toBeVisible();
  }

  /** Confirmed live: the menu can detach mid-click even after opening successfully — retry re-opens and re-clicks. */
  async clickActionMenuItem(title: string, label: string): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        if (attempt > 1) await this.openRowActionMenu(title);
        await this.listings.rowActionMenuItem(title, label).click({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async assertSellConfirmationDialogVisible(): Promise<void> {
    await this.listings.sellConfirmationDialog.expect.toBeVisible();
  }

  /** Only Cancel is automated — see requirements doc §2 for why "Yes, Proceed" never is. */
  async cancelSellConfirmation(): Promise<void> {
    await this.listings.sellConfirmationCancelButton.click();
  }

  // --- Sort (confirmed broken — see §2a) ---

  async clickPriceSort(): Promise<void> {
    await this.listings.priceSortButton.click();
  }

  async clickUpdatedDateSort(): Promise<void> {
    await this.listings.updatedDateSortButton.click();
  }

  async assertTableStillPopulated(): Promise<void> {
    await this.listings.table.expect.toBeVisible();
    await this.listings.paginationSummary.expect.toBeVisible();
  }

  // --- Filter panel ---

  async openFilter(): Promise<void> {
    await this.listings.filterButton.click();
  }

  async applyFilter(): Promise<void> {
    await this.listings.filterApplyButton.click();
  }

  async cancelFilter(): Promise<void> {
    await this.listings.filterCancelButton.click();
  }

  /** Confirmed live: Clear all applies and closes the dialog immediately — no separate Apply click needed. */
  /**
   * Confirmed live: Clear all applies and closes the dialog immediately when it
   * works — but shares the same click race as every other toggle in this app
   * (see `filterByStatus`), and confirmed live a second time that the panel
   * closing is NOT a reliable success signal here — the same "outside click"
   * misfire that closes it on a real click can also close it on a *missed*
   * one, without the filters actually clearing. The URL is the only real signal.
   */
  async clearAllFilters(): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        if (attempt > 1) await this.openFilter();
        await this.listings.filterClearAllButton.click();
        await this.deps.pageAssert.urlIs(/\?tab=listings$/, { timeout: isLastAttempt ? 6000 : 1500 });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  /**
   * For the Cancel scenario (BIDC-298 §6) — selects without clicking Apply, so
   * Cancel has something real to discard. Shares the same option-selection race
   * as `filterByStatus` (see there), so the same bounded retry applies.
   */
  async selectStatusWithoutApplying(status: string): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        await this.listings.statusFilterDropdown.click();
        await this.listings.statusFilterOption(status).click();
        await this.listings.statusFilterDropdown.expect.toContainText(status, {
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async assertNoFiltersApplied(): Promise<void> {
    await this.deps.pageAssert.urlSearchAndHashDoesNotMatch(/status=|minPrice=|maxPrice=/i);
  }

  /**
   * Confirmed live: selecting a Status option (and separately, Apply itself) can
   * silently no-op — retry the whole select-then-apply flow. Kept fast per
   * attempt (the race either resolves in ~1s or is permanently stuck — a long
   * wait never recovers it), and confirmed live under full-suite load that this
   * flow's failure rate is high enough that 3 attempts isn't always enough —
   * more short attempts (a failed one costs ~2.5s) fits comfortably inside the
   * scenario's overall test timeout and is more effective than fewer, longer ones.
   */
  async filterByStatus(status: string): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      const timeout = isLastAttempt ? 6000 : 1500;
      try {
        if (attempt > 1) await this.openFilter();
        await this.listings.statusFilterDropdown.click();
        await this.listings.statusFilterOption(status).click();
        await this.listings.statusFilterDropdown.expect.toContainText(status, { timeout });
        await this.applyFilter();
        await this.deps.pageAssert.urlContains(`status=${status}`, { timeout });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async filterByPriceRange(min: number, max: number): Promise<void> {
    await this.listings.priceFilterMinSlider.fill(String(min));
    await this.listings.priceFilterMaxSlider.fill(String(max));
    await this.applyFilter();
  }

  async assertPriceRangeText(min: number, max: number): Promise<void> {
    const formatted = (n: number) => `$${n.toLocaleString("en-US")}`;
    await this.listings.priceFilterRangeText.expect.toContainText(formatted(min));
    await this.listings.priceFilterRangeText.expect.toContainText(formatted(max));
  }

  /** Real min/max shift as listings are created/removed — read live from the slider, never hardcode. */
  async getPriceFilterBounds(): Promise<{ min: number; max: number }> {
    const min = Number(await this.listings.priceFilterMinSlider.attribute("min"));
    const max = Number(await this.listings.priceFilterMaxSlider.attribute("max"));
    return { min, max };
  }

  async assertPriceFilterDefaultsToFullRange(): Promise<void> {
    const { min, max } = await this.getPriceFilterBounds();
    await this.assertPriceRangeText(min, max);
  }

  async setPriceFilterToBoundaryValues(): Promise<void> {
    const { min, max } = await this.getPriceFilterBounds();
    await this.filterByPriceRange(min, max);
  }

  async assertPriceFilterReflectsBoundaryValues(): Promise<void> {
    const { min, max } = await this.getPriceFilterBounds();
    await this.assertPriceRangeText(min, max);
  }

  /**
   * Calendar button click can silently fail to open the popup (same race as the
   * Status dropdown) — retry until visible. More short attempts, confirmed live
   * under full-suite load (see `filterByStatus`).
   */
  private async openDateCalendar(calendarButton: Button): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await calendarButton.click();
      const isLastAttempt = attempt === maxAttempts;
      try {
        await this.listings.dateCalendarPopup.expect.toBeVisible({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  /**
   * Confirmed live: clicking a From day shares the same click race as the rest
   * of this app's toggles — a missed click leaves the To calendar button
   * permanently disabled (it only enables once From genuinely commits), which
   * then fails much later and less clearly. Retrying the day click itself,
   * verified against To actually enabling, catches it at the source.
   */
  private async pickFromDateAndConfirm(date: Date): Promise<void> {
    const dayName = buildCalendarDayName(date);
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        if (attempt > 1) await this.openDateCalendar(this.listings.dateFromCalendarButton);
        await this.listings.calendarDay(dayName).click();
        await this.listings.dateToCalendarButton.expect.toBeEnabled({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async filterByDateRange(from: Date, to: Date): Promise<void> {
    await this.openDateCalendar(this.listings.dateFromCalendarButton);
    await this.pickFromDateAndConfirm(from);
    await this.openDateCalendar(this.listings.dateToCalendarButton);
    await this.listings.calendarDay(buildCalendarDayName(to)).click();
    await this.applyFilter();
  }

  async assertDateToDisabledBeforeFromChosen(): Promise<void> {
    await this.listings.dateToInput.expect.toBeDisabled();
  }

  async pickFilterFromDate(date: Date): Promise<void> {
    await this.openDateCalendar(this.listings.dateFromCalendarButton);
    await this.pickFromDateAndConfirm(date);
  }

  /** Confirmed live: once From is picked, every date before it is disabled in the To calendar — there's no way to construct an invalid range through the UI. */
  async assertToCalendarDayDisabled(date: Date): Promise<void> {
    await this.openDateCalendar(this.listings.dateToCalendarButton);
    await this.listings.calendarDay(buildCalendarDayName(date, "Not available")).expect.toBeDisabled();
  }

  async assertEmptyStateVisible(): Promise<void> {
    await this.listings.emptyStateMessage.expect.toBeVisible();
  }

  async assertStatusFilterAppliedInUrl(status: string): Promise<void> {
    await this.deps.pageAssert.urlContains(`status=${status}`);
  }

  /** Confirmed live: unauthenticated direct access redirects to /login?callbackUrl=%2Fdashboard — see docs/requirements/listings-automation-requirements.md §2. */
  async openListingsDirectly(): Promise<void> {
    await this.deps.nav.goto("/dashboard?tab=listings");
  }

  async assertRedirectedToLogin(): Promise<void> {
    await this.deps.pageAssert.urlContains("/login");
  }

  /** A crash would move the URL off /dashboard — staying confirms the input was handled safely. */
  async assertPageDidNotCrash(): Promise<void> {
    await this.deps.pageAssert.urlContains("/dashboard");
  }
}
