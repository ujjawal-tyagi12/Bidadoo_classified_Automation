import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

const SECTION_LABELS = {
  category: "Category",
  model: "Model",
  location: "Location",
  price: "Price Range",
  year: "Year",
  hoursMilesKm: "Hours",
} as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactTextPattern(value: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`);
}

/**
 * Desktop filter sidebar (always visible, no trigger button — confirmed live
 * at 1280px+; the ≤768px overlay variant is out of scope for this P0 pass).
 * 6 collapsible sections: Category, Model, Location, Price Range, Year,
 * Hours / Miles / Kilometers — each wrapped in its own
 * `div.border-t.border-black-10` container, confirmed live, which every
 * section-scoped locator below uses to avoid cross-section name collisions
 * (Category/Model/Location option rows all share the same `span.text-heading-xsm`
 * class). See docs/requirements/equipment-listing-automation-requirements.md §3.
 */
export class FilterPanelPage extends BasePage {
  private sectionContainer(label: string) {
    return this.page
      .locator("div.border-t.border-black-10", {
        has: this.page.locator("button", { hasText: label }),
      })
      .first();
  }

  private get categorySection() {
    return this.sectionContainer(SECTION_LABELS.category);
  }

  private get modelSection() {
    return this.sectionContainer(SECTION_LABELS.model);
  }

  private get locationSection() {
    return this.sectionContainer(SECTION_LABELS.location);
  }

  private get priceSection() {
    return this.sectionContainer(SECTION_LABELS.price);
  }

  private get yearSection() {
    return this.sectionContainer(SECTION_LABELS.year);
  }

  private get hoursSection() {
    return this.sectionContainer(SECTION_LABELS.hoursMilesKm);
  }

  /**
   * The sidebar/overlay's own "Filters" heading — used to assert the panel
   * is present. Confirmed live: at desktop widths only one `<p>Filters</p>`
   * exists (visible). Once the mobile overlay is open, a **second** hidden
   * `<p>Filters</p>` also exists in the DOM — the desktop sidebar's own
   * heading, still rendered off-screen underneath the overlay, appearing
   * *before* the overlay's own heading in DOM order. `.first()` would pick
   * that hidden one; `.last()` correctly resolves to the visible heading in
   * both contexts (the only match at desktop, the second/visible match once
   * the mobile overlay is open).
   */
  get filtersHeading() {
    return surfaceLocator("Filters sidebar heading")
      .desktop((p) => p.locator('p:text-is("Filters")').last())
      .build(this.page, this.surface);
  }

  /**
   * Confirmed live via DOM ancestor inspection: this button lives inside
   * `<aside>` (the filter sidebar itself), always present regardless of
   * filter state — a structurally distinct element from the tag bar's own
   * "Clear All" in `<main>` (see `SearchResultsPage.tagBarClearAllButton`),
   * not two positions within one ambiguous match set. Scoping to `<aside>`
   * avoids the same positional-index trap documented there.
   */
  get sidebarClearAllButton() {
    return surfaceLocator("Sidebar Clear All button")
      .asButton()
      .desktop((p) => p.locator("aside").getByRole("button", { name: "Clear All", exact: true }))
      .build(this.page, this.surface);
  }

  get applyFiltersButton() {
    return surfaceLocator("Apply Filters button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Apply Filters" }))
      .build(this.page, this.surface);
  }

  /** The accordion header toggle for one of the 6 sections. */
  sectionToggle(label: string) {
    return surfaceLocator(`Filter section toggle: ${label}`)
      .asButton()
      .desktop(() => this.sectionContainer(label).locator("button").first())
      .build(this.page, this.surface);
  }

  /**
   * All 6 section wrapper containers, in DOM order. Confirmed live: each is
   * `div.border-t.border-black-10` — this is also the visible divider line
   * between sections, so counting these containers doubles as the divider
   * count.
   */
  get filterSectionContainers() {
    return surfaceLocator("Filter section containers")
      .desktop((p) => p.locator("aside div.border-t.border-black-10"))
      .build(this.page, this.surface);
  }

  /**
   * The real internal scroll container for one section's option list once
   * expanded. Confirmed live: `div.overflow-y-auto` wraps the rendered rows
   * and genuinely overflows (`scrollHeight` > `clientHeight`) once a section
   * has enough rows — distinct from BIDC-473's separate finding that
   * scrolling does not fetch additional (unrendered) items from the API.
   */
  sectionScrollableArea(label: string) {
    return surfaceLocator(`Section scrollable area: ${label}`)
      .desktop(() => this.sectionContainer(label).locator("div.overflow-y-auto"))
      .build(this.page, this.surface);
  }

  /**
   * Every section toggle button's own text, in real DOM order. Confirmed
   * live this query (`aside div.border-t.border-black-10 button`) resolves
   * to exactly 6 matches at the default (all-collapsed) panel state —
   * Category, Model, Location, Price Range, Year, Hours / Miles /
   * Kilometers, with no "Brands" section anywhere.
   */
  get filterSectionToggleLabels() {
    return surfaceLocator("Filter section toggle labels (rendered, in order)")
      .desktop((p) => p.locator("aside div.border-t.border-black-10 button"))
      .build(this.page, this.surface);
  }

  /**
   * The Hours/Miles/Kilometers section's own range label (e.g. "Hours /
   * Miles: 356 - 19,658") — distinct from the section's toggle-button
   * heading text ("Hours / Miles / Kilometers"). Confirmed live this is a
   * fixed compound string, not a per-listing-type swap between "Hours" and
   * "Miles" alone.
   */
  get hoursMilesUnitLabel() {
    return surfaceLocator("Hours/Miles/Km unit label")
      .desktop(() => this.hoursSection.getByText(/^Hours \/ Miles:/))
      .build(this.page, this.surface);
  }

  // --- Category tree (hierarchical, up to 3 levels deep) ---

  /** A category node's clickable label (checks/unchecks it — parent nodes cascade to all descendant leaves). */
  categoryNodeLabel(name: string) {
    return surfaceLocator(`Category node label: ${name}`)
      .asButton()
      .desktop(() =>
        this.categorySection
          .locator("span.text-heading-xsm", { hasText: exactTextPattern(name) })
          .first(),
      )
      .build(this.page, this.surface);
  }

  /** The nested expand/collapse chevron button for a category node (absent on true leaves). */
  categoryNodeExpandToggle(name: string) {
    return surfaceLocator(`Category node expand toggle: ${name}`)
      .asButton()
      .desktop(() =>
        this.categorySection
          .locator("span.text-heading-xsm", { hasText: exactTextPattern(name) })
          .first()
          .locator("xpath=ancestor::label[1]/button[1]"),
      )
      .build(this.page, this.surface);
  }

  /** The category node's underlying (visually hidden) checkbox — read-only, for `.isChecked()` / `.expect.toBeChecked()`. */
  categoryNodeCheckboxState(name: string) {
    return surfaceLocator(`Category node checkbox state: ${name}`)
      .asCheckbox()
      .desktop(() =>
        this.categorySection
          .locator("span.text-heading-xsm", { hasText: exactTextPattern(name) })
          .first()
          .locator("xpath=ancestor::label[1]//input[@type='checkbox']"),
      )
      .build(this.page, this.surface);
  }

  /**
   * All *rendered* top-level category row labels, in DOM order. Confirmed
   * live: the accordion renders only a fixed subset (10 of the API's 16 real
   * top-level nodes, with no scroll/"load more" affordance to reach the
   * rest) — picking a category by name must be constrained to this rendered
   * set, not the full API taxonomy, or the pick may be a real value that is
   * simply unreachable in the UI.
   */
  get categoryTopLevelLabels() {
    return surfaceLocator("Category top-level labels (rendered)")
      .desktop(() => this.categorySection.locator("span.text-heading-xsm"))
      .build(this.page, this.surface);
  }

  /**
   * Every rendered Category `<label>` row (checkbox + text + count),
   * top-level nodes only. Used for row-spacing (bounding boxes) and
   * count-format (full row text, not just the name span) assertions.
   */
  get categoryOptionRows() {
    return surfaceLocator("Category option rows (rendered)")
      .desktop(() => this.categorySection.locator("label"))
      .build(this.page, this.surface);
  }

  // --- Model / Location (flat checkbox lists, same row markup minus the expand toggle) ---

  /**
   * All *rendered* model option row labels. Confirmed live: the list renders
   * only a fixed subset (9 of the API's 32 real models with results, with no
   * working scroll/"load more" to reach the rest) — see
   * `categoryTopLevelLabels` above for the identical pattern.
   */
  get modelOptionLabels() {
    return surfaceLocator("Model option labels (rendered)")
      .desktop(() => this.modelSection.locator("span.text-heading-xsm"))
      .build(this.page, this.surface);
  }

  modelOptionLabel(name: string) {
    return surfaceLocator(`Model option label: ${name}`)
      .asButton()
      .desktop(() =>
        this.modelSection
          .locator("span.text-heading-xsm", { hasText: exactTextPattern(name) })
          .first(),
      )
      .build(this.page, this.surface);
  }

  /** Every rendered Model `<label>` row (checkbox + text + count) — mirrors `categoryOptionRows`. */
  get modelOptionRows() {
    return surfaceLocator("Model option rows (rendered)")
      .desktop(() => this.modelSection.locator("label"))
      .build(this.page, this.surface);
  }

  /**
   * All *rendered* location option row labels. Mirrors `modelOptionLabels`
   * above: the sidebar renders only a fixed subset of the API's real state/
   * province list, confirmed live via BIDC-469's `pickRealLocation()` timing
   * out clicking an API-real but unrendered name ("Hawaii") — see
   * docs/requirements/equipment-search-automation-requirements.md.
   */
  get locationOptionLabels() {
    return surfaceLocator("Location option labels (rendered)")
      .desktop(() => this.locationSection.locator("span.text-heading-xsm"))
      .build(this.page, this.surface);
  }

  locationOptionLabel(name: string) {
    return surfaceLocator(`Location option label: ${name}`)
      .asButton()
      .desktop(() =>
        this.locationSection
          .locator("span.text-heading-xsm", { hasText: exactTextPattern(name) })
          .first(),
      )
      .build(this.page, this.surface);
  }

  /** The Location node's underlying (visually hidden) checkbox — mirrors `categoryNodeCheckboxState`. */
  locationOptionCheckboxState(name: string) {
    return surfaceLocator(`Location option checkbox state: ${name}`)
      .asCheckbox()
      .desktop(() =>
        this.locationSection
          .locator("span.text-heading-xsm", { hasText: exactTextPattern(name) })
          .first()
          .locator("xpath=ancestor::label[1]//input[@type='checkbox']"),
      )
      .build(this.page, this.surface);
  }

  // --- Price / Year / Hours-Miles-Km dual-thumb range sliders ---
  // No free-text input exists for these — confirmed live self-clamping
  // native `<input type="range">` pairs. Driven via keyboard through the
  // GenericElement `.run()` escape hatch (see FilterPanelActions).

  get priceMinThumb() {
    return surfaceLocator("Price min thumb")
      .desktop(() => this.priceSection.locator("input.min-thumb"))
      .build(this.page, this.surface);
  }

  get priceMaxThumb() {
    return surfaceLocator("Price max thumb")
      .desktop(() => this.priceSection.locator("input.max-thumb"))
      .build(this.page, this.surface);
  }

  get yearMinThumb() {
    return surfaceLocator("Year min thumb")
      .desktop(() => this.yearSection.locator("input.min-thumb"))
      .build(this.page, this.surface);
  }

  get yearMaxThumb() {
    return surfaceLocator("Year max thumb")
      .desktop(() => this.yearSection.locator("input.max-thumb"))
      .build(this.page, this.surface);
  }

  get hoursMinThumb() {
    return surfaceLocator("Hours/Miles/Km min thumb")
      .desktop(() => this.hoursSection.locator("input.min-thumb"))
      .build(this.page, this.surface);
  }

  get hoursMaxThumb() {
    return surfaceLocator("Hours/Miles/Km max thumb")
      .desktop(() => this.hoursSection.locator("input.max-thumb"))
      .build(this.page, this.surface);
  }

  // --- Mobile filter trigger + overlay (equipment-listing TC16/TC26/TC40) ---

  /**
   * Confirmed live via computed-style inspection: this button exists in the
   * DOM at every viewport (same element `filtersHeading`'s own doc comment
   * already flagged as a "second, hidden 'mobile trigger'" match for the
   * exact text "Filters"), but its bounding box collapses to zero size at
   * desktop widths (≥1280px, confirmed) and is genuinely visible at ≤768px
   * (confirmed at both 768px and 390px) — so `.expect.toBeVisible()` /
   * `.expect.toBeHidden()` resolve correctly per viewport with no extra
   * logic needed here.
   */
  get mobileFiltersTriggerButton() {
    return surfaceLocator("Mobile Filters trigger button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Filters", exact: true }))
      .build(this.page, this.surface);
  }

  /**
   * Close (×) control on the mobile full-screen filter overlay opened by
   * `mobileFiltersTriggerButton`. Confirmed live: real `aria-label="Close
   * filters"`, a unique accessible name distinct from the sidebar's own
   * "Clear All"/"Filters" text.
   */
  get mobileFilterOverlayCloseButton() {
    return surfaceLocator("Mobile filter overlay close button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Close filters" }))
      .build(this.page, this.surface);
  }
}

export { SECTION_LABELS };
