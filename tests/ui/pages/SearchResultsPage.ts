import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Confirmed live: a mocked failure on the favorites-toggle endpoint surfaces
 * a real toast that echoes the response body's `message` field verbatim —
 * used by both the mock (`FavoriteActions.mockFavoriteToggleFailure`) and
 * the assertion below so they can never drift apart.
 */
export const FAVORITE_MOCK_FAILURE_MESSAGE = "Automation-simulated favorite failure";

/**
 * `/search` results page: header/footer result counts, sort dropdown,
 * pagination, active-filter tag bar, and result cards. Selectors confirmed
 * live against the QA app — see
 * docs/requirements/equipment-listing-automation-requirements.md §3.
 */
export class SearchResultsPage extends BasePage {
  /** "Showing 1 of N results" (header). */
  get resultsHeaderCount() {
    return surfaceLocator("Results header count")
      .desktop((p) => p.getByText(/Showing \d+ of \d+ results/i).first())
      .build(this.page, this.surface);
  }

  /** "Showing X-Y From Z" (footer). */
  get resultsFooterCount() {
    return surfaceLocator("Results footer count")
      .desktop((p) => p.getByText(/Showing \d+-\d+ From \d+/i).first())
      .build(this.page, this.surface);
  }

  /** "Of <n>" total-pages text next to the current page number. */
  get paginationTotalPagesText() {
    return surfaceLocator("Pagination total pages text")
      .desktop((p) => p.getByText(/^Of \d+$/).first())
      .build(this.page, this.surface);
  }

  get sortTrigger() {
    return surfaceLocator("Sort by trigger")
      .asButton()
      .desktop((p) => p.getByText(/Sort by:/i).first())
      .build(this.page, this.surface);
  }

  sortOption(label: string) {
    return surfaceLocator(`Sort option: ${label}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  get paginationFirstButton() {
    return surfaceLocator("Pagination First page button")
      .asButton()
      .desktop((p) => p.locator('button[title="First page"]'))
      .build(this.page, this.surface);
  }

  get paginationPreviousButton() {
    return surfaceLocator("Pagination Previous page button")
      .asButton()
      .desktop((p) => p.locator('button[title="Previous page"]'))
      .build(this.page, this.surface);
  }

  get paginationNextButton() {
    return surfaceLocator("Pagination Next page button")
      .asButton()
      .desktop((p) => p.locator('button[title="Next page"]'))
      .build(this.page, this.surface);
  }

  get paginationLastButton() {
    return surfaceLocator("Pagination Last page button")
      .asButton()
      .desktop((p) => p.locator('button[title="Last page"]'))
      .build(this.page, this.surface);
  }

  /** Custom (non-native) items-per-page `<select>`. */
  get itemsPerPageDropdown() {
    return surfaceLocator("Items per page dropdown")
      .asDropdown()
      .desktop((p) =>
        p.locator("div", { has: p.getByText("Items per page") }).locator("select"),
      )
      .build(this.page, this.surface);
  }

  /** "View Details" button on a result card, by 0-based index in the grid. */
  viewDetailsButton(index = 0) {
    return surfaceLocator(`View Details button #${index}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "View Details" }).nth(index))
      .build(this.page, this.surface);
  }

  /**
   * Favorite icon on a result card, by 0-based index — confirmed live: real
   * `aria-label="favourite"` (lowercase, British spelling; distinct from the
   * detail page's `aria-label="Favorite"` button — see
   * docs/requirements/equipment-favorite-automation-requirements.md §2).
   */
  favoriteButton(index = 0) {
    return surfaceLocator(`Favorite button #${index}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "favourite" }).nth(index))
      .build(this.page, this.surface);
  }

  /**
   * The favorite button's inner `<img>` — the only real, assertable state
   * signal (`src` contains `star-outline.svg` or `star-filled.svg`); no
   * `aria-pressed` is ever set on the button itself (confirmed live).
   */
  favoriteIcon(index = 0) {
    return surfaceLocator(`Favorite icon image #${index}`)
      .desktop((p) => p.getByRole("button", { name: "favourite" }).nth(index).locator("img"))
      .build(this.page, this.surface);
  }

  /** Confirmed live: a mocked API failure on the favorites-toggle call surfaces this real toast, not a silent no-op. */
  get favoriteErrorToast() {
    return surfaceLocator("Favorite error toast")
      .desktop((p) => p.getByText(FAVORITE_MOCK_FAILURE_MESSAGE))
      .build(this.page, this.surface);
  }

  /**
   * All "View Details" buttons across the results grid, unindexed — used
   * for a light structural styling-consistency check (TC18), not for
   * clicking a specific one (use `viewDetailsButton(index)` for that).
   */
  get viewDetailsButtons() {
    return surfaceLocator("All View Details buttons")
      .desktop((p) => p.getByRole("button", { name: "View Details" }))
      .build(this.page, this.surface);
  }

  /**
   * A result card's "View Details" button, found by the card's exact title
   * (via its photo `alt`) rather than positional index. Needed once several
   * near-duplicate titles can exist (e.g. repeated seeded test listings) —
   * confirmed live that this app's search tokenizes rather than
   * exact-phrase-matches, so a search for a supposedly-unique title can
   * still return many older near-duplicates ahead of it depending on sort
   * order; `viewDetailsButton(0)` is not reliable in that case.
   */
  viewDetailsButtonForExactTitle(title: string) {
    return surfaceLocator(`View Details button for title: ${title}`)
      .asButton()
      .desktop((p) =>
        p
          .locator("div.rounded-2xl.shadow-sm", { has: p.locator(`img[alt="${title}"]`) })
          .getByRole("button", { name: "View Details" }),
      )
      .build(this.page, this.surface);
  }

  /**
   * A result card's title, read from its equipment photo's `alt` attribute
   * (confirmed live to equal the listing title) — used to detect real
   * re-ordering after a sort change, since the "Sort by:" trigger's own
   * label text is confirmed live to NOT update after selecting an option
   * (see the equipment-listing build report for this finding).
   */
  resultCardTitle(index = 0) {
    return surfaceLocator(`Result card title #${index}`)
      .desktop((p) =>
        p
          .getByRole("button", { name: "View Details" })
          .nth(index)
          .locator("xpath=ancestor::div[contains(@class,'rounded-2xl') and contains(@class,'shadow-sm')][1]")
          .locator("img[alt]")
          .first(),
      )
      .build(this.page, this.surface);
  }

  /** Active filter tag pill's text span — `data-chip-text` confirmed live. */
  activeFilterChip(labelText: string) {
    return surfaceLocator(`Active filter chip: ${labelText}`)
      .desktop((p) => p.locator("[data-chip-text='true']", { hasText: labelText }))
      .build(this.page, this.surface);
  }

  /** × control on a chip — `aria-label="Remove <chip text>"` confirmed live. */
  removeFilterTagButton(chipText: string) {
    return surfaceLocator(`Remove filter tag: ${chipText}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: `Remove ${chipText}` }))
      .build(this.page, this.surface);
  }

  /** The "N More" overflow pill in the active-filter tag bar. */
  get overflowMorePill() {
    return surfaceLocator("Overflow 'N More' pill")
      .desktop((p) => p.getByText(/^\d+ More$/).first())
      .build(this.page, this.surface);
  }

  /**
   * Tag-bar "Clear All" — a real `<button>` that only renders while a filter
   * or search term is active. Confirmed live via DOM ancestor inspection
   * that this button and the sidebar's own "Clear All" (see
   * `FilterPanelPage.sidebarClearAllButton`) are NOT two visually-different
   * instances of one ambiguous match set — they live in genuinely different
   * containers: this one inside the results toolbar box in `<main>`
   * (`div.bg-white.border.border-black-10.rounded-xl`, the same box that
   * wraps the active-filter chips), the sidebar's inside `<aside>`. A bare
   * `getByRole(...).first()`/`.last()` across both breaks the moment this
   * one disappears (its own set membership changes), silently re-resolving
   * "first" to the sidebar's always-present one instead of correctly
   * reporting "not found" — scoping to this button's actual container
   * avoids that positional-index trap entirely.
   */
  get tagBarClearAllButton() {
    return surfaceLocator("Tag bar Clear All button")
      .asButton()
      .desktop((p) =>
        p
          .locator("main div.bg-white.border.border-black-10.rounded-xl")
          .getByRole("button", { name: "Clear All", exact: true }),
      )
      .build(this.page, this.surface);
  }

  /** The generic empty-state message — reused for zero-result, 422, and 500 cases (see §4 of the requirements doc). */
  get emptyStateMessage() {
    return surfaceLocator("Empty state message")
      .desktop((p) =>
        p.getByText("No equipment matches your selected filters. Try adjusting your search."),
      )
      .build(this.page, this.surface);
  }

  /**
   * `/search` page's own meta description — confirmed live to be real and
   * distinct from the homepage's ("Find the best equipment for your needs"
   * vs. the homepage's longer copy) — see requirements doc §7 (TC43).
   */
  get metaDescriptionTag() {
    return surfaceLocator("Search results page meta description tag")
      .desktop((p) => p.locator('meta[name="description"]'))
      .build(this.page, this.surface);
  }
}
