import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Homepage — search bar and "Shop by Category" cards. Confirmed live against
 * the QA app: the search input never submits on Enter, only the dedicated
 * search icon button does (see
 * docs/requirements/equipment-listing-automation-requirements.md §4).
 */
export class HomePage extends BasePage {
  get searchInput() {
    return surfaceLocator("Search equipment input")
      .asTextInput()
      .desktop((p) => p.locator('input[aria-label="Search equipment"]'))
      .build(this.page, this.surface);
  }

  get searchButton() {
    return surfaceLocator("Search button")
      .asButton()
      .desktop((p) => p.locator('button[aria-label="Search"]'))
      .build(this.page, this.surface);
  }

  /**
   * A "Shop by Category" card — a real `<a href="/search?categoryId=...">`
   * that opens in a new tab (`target="_blank"`, confirmed live). Its
   * accessible name is not an exact match for the category name alone (the
   * card's image `alt` text combines with the label), so this intentionally
   * does not use `exact: true` — confirmed live to resolve to exactly the
   * one real card and not the header's mega-menu (which uses a different
   * element shape, not `role="link"`, for the same category name).
   */
  categoryCard(name: string) {
    return surfaceLocator(`Shop by Category card: ${name}`)
      .asButton()
      .desktop((p) => p.getByRole("link", { name }))
      .build(this.page, this.surface);
  }

  /**
   * Wraps both the Location trigger button and its option panel — confirmed
   * live this is the one `.relative.flex.group` container on the homepage
   * (the search input's own wrapper uses a different class set), so scoping
   * to it disambiguates the Location list's `<li>`s from any other list on
   * the page. Scoped by `aria-haspopup="listbox"` only (no text filter) —
   * confirmed live this is a native DOM attribute, unique on the homepage,
   * and stable across a selection (unlike the button's own text, which
   * changes from "Location" to the selected state's name once one is
   * picked). Confirmed live: no `data-testid`/`data-testvalue` or
   * `role="listbox"`/`role="option"` exists anywhere in this component's
   * real DOM, so this ARIA attribute is the most stable selector actually
   * available — see docs/requirements/equipment-search-automation-requirements.md §3.
   */
  private get locationWrapper() {
    return this.page.locator(".relative.flex.group", {
      has: this.page.locator('button[aria-haspopup="listbox"]'),
    });
  }

  /**
   * Confirmed live: a plain `.click()` intermittently leaves the panel
   * closed with no network call fired — hovering immediately before the
   * click reliably opens it (see requirements doc §3/§8). Callers must
   * `.hover()` this element before `.click()`ing it. Its own text reads
   * "Location" until a state is picked, after which it reads the selected
   * state's name (confirmed live) — used by `assertLocationSelected` below.
   */
  get locationTrigger() {
    return surfaceLocator("Location dropdown trigger")
      .asButton()
      .desktop((p) => p.locator('button[aria-haspopup="listbox"]'))
      .build(this.page, this.surface);
  }

  /**
   * The scrollable options panel. Confirmed live it lazy-loads 10
   * states/provinces at a time — scrolling this element's `scrollTop` to its
   * `scrollHeight` triggers the next page fetch.
   */
  get locationOptionsPanel() {
    return surfaceLocator("Location dropdown options panel")
      .desktop(() => this.locationWrapper.locator(".overflow-auto"))
      .build(this.page, this.surface);
  }

  /** All currently-rendered option rows — grows as `locationOptionsPanel` is scrolled. */
  get locationOptionItems() {
    return surfaceLocator("Location dropdown option items")
      .desktop(() => this.locationWrapper.locator("li"))
      .build(this.page, this.surface);
  }

  /**
   * A single state/province option by its exact rendered visible text.
   * Confirmed live there is no `data-testid`/`data-testvalue` or `role`
   * attribute on the option `<li>`/`<button>` (both carry only Tailwind
   * utility classes) — visible text, scoped to `locationWrapper` to avoid
   * matching unrelated text elsewhere on the page, is the most stable
   * locator actually available for this element.
   */
  locationOptionByName(name: string) {
    return surfaceLocator(`Location option: ${name}`)
      .asButton()
      .desktop(() => this.locationWrapper.locator("li", { hasText: name }).locator("button"))
      .build(this.page, this.surface);
  }

  /**
   * The static "browse" panel shown under the search input on focus
   * (Recently Added / Popular Equipment / Top Sellers + brand/category
   * shortcuts). Confirmed live this renders identically regardless of the
   * input's value — see requirements doc §3/§5 (TC10/TC17).
   */
  get suggestionsPanel() {
    return surfaceLocator("Search suggestions panel")
      .desktop((p) => p.locator("ul.text-dark-100.space-y-1.gap-20.flex.flex-col.font-normal"))
      .build(this.page, this.surface);
  }

  // --- SEO meta tags (equipment-listing TC43) ---
  // Confirmed live: real, present `<meta>`/`<link>` tags in the homepage
  // `<head>` — see docs/requirements/equipment-listing-automation-requirements.md
  // §7 (TC43). Read via `.attribute()`, not `.expect.toBeVisible()` — these
  // tags never render visually.

  get metaDescriptionTag() {
    return surfaceLocator("Homepage meta description tag")
      .desktop((p) => p.locator('meta[name="description"]'))
      .build(this.page, this.surface);
  }

  get metaKeywordsTag() {
    return surfaceLocator("Homepage meta keywords tag")
      .desktop((p) => p.locator('meta[name="keywords"]'))
      .build(this.page, this.surface);
  }

  get metaOgTitleTag() {
    return surfaceLocator("Homepage og:title meta tag")
      .desktop((p) => p.locator('meta[property="og:title"]'))
      .build(this.page, this.surface);
  }

  get canonicalLinkTag() {
    return surfaceLocator("Homepage canonical link tag")
      .desktop((p) => p.locator('link[rel="canonical"]'))
      .build(this.page, this.surface);
  }

  /** Confirmed live: `width=device-width, initial-scale=1`, no zoom-blocking attributes (TC41). */
  get viewportMetaTag() {
    return surfaceLocator("Homepage viewport meta tag")
      .desktop((p) => p.locator('meta[name="viewport"]'))
      .build(this.page, this.surface);
  }

  /** All `<h1>` headings on the homepage — used to confirm exactly one exists (TC43). */
  get h1Headings() {
    return surfaceLocator("Homepage H1 headings")
      .desktop((p) => p.locator("h1"))
      .build(this.page, this.surface);
  }
}
