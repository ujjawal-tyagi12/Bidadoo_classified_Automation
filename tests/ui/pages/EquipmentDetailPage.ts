import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/** Field-table rows confirmed live on `/search/<id>` (each a real `<li>` with a label span + value span). */
export const DETAIL_FIELD_LABELS = [
  "Reference ID",
  "Make",
  "Model",
  "Year",
  "Usage",
  "Location",
  "Company Name",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactTextPattern(value: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`);
}

/**
 * `/search/<equipment-id>` equipment detail page, reached only via a result
 * card's "View Details" button (category cards and search-bar submissions
 * land on the results page, not here — confirmed live, see
 * docs/requirements/equipment-listing-automation-requirements.md §3).
 *
 * Field/section selectors below confirmed live against the one stable
 * image-based listing found in QA data (see
 * docs/requirements/equipment-detail-automation-requirements.md §2-3) —
 * most other sampled listings are video-based and intermittently fail to
 * render (same doc, §4), so content assertions should target that fixture.
 */
export class EquipmentDetailPage extends BasePage {
  /** "HOME | EQUIPMENT | <TITLE>" — confirmed uppercase. */
  get breadcrumb() {
    return surfaceLocator("Equipment detail breadcrumb")
      .desktop((p) => p.getByText(/^HOME\s*\|\s*EQUIPMENT\s*\|/i))
      .build(this.page, this.surface);
  }

  get contactSellerButton() {
    return surfaceLocator("Contact Seller button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Contact Seller" }).first())
      .build(this.page, this.surface);
  }

  /** "CAD $100" style value next to the "Asking Price" label — confirmed live: a `div.bg-white.p-5` container with an `<h4>` value. */
  get askingPriceValue() {
    return surfaceLocator("Asking Price value")
      .desktop((p) => p.locator("div.bg-white.p-5").locator("h4").first())
      .build(this.page, this.surface);
  }

  /** A field-table row's value span, by its exact label (Reference ID, Make, Model, Year, Usage, Location, Company Name). */
  fieldValue(label: string) {
    return surfaceLocator(`Detail field value: ${label}`)
      .desktop((p) =>
        p
          .locator("li", { has: p.locator("span", { hasText: exactTextPattern(label) }) })
          .locator("span")
          .last(),
      )
      .build(this.page, this.surface);
  }

  // --- Gallery ---

  /** Thumbnail rail item, 1-based to match the confirmed live `alt="thumb-<n>"` pattern. */
  thumbnailButton(index: number) {
    return surfaceLocator(`Thumbnail button #${index}`)
      .asButton()
      .desktop((p) =>
        p.locator(`img[alt="thumb-${index}"]`).locator("xpath=ancestor::button[1]"),
      )
      .build(this.page, this.surface);
  }

  get openImageViewerButton() {
    return surfaceLocator("Open image viewer button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Open image viewer" }))
      .build(this.page, this.surface);
  }

  get downloadAllImagesButton() {
    return surfaceLocator("Download all images button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Download all images" }))
      .build(this.page, this.surface);
  }

  get shareButton() {
    return surfaceLocator("Share button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Share" }))
      .build(this.page, this.surface);
  }

  get favoriteButton() {
    return surfaceLocator("Favorite button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Favorite" }))
      .build(this.page, this.surface);
  }

  /**
   * The favorite button's inner `<img>` — the only real, assertable state
   * signal (`src` contains `star-outline.svg` or `star-filled.svg`); no
   * `aria-pressed` is ever set on the button itself (confirmed live, see
   * docs/requirements/equipment-favorite-automation-requirements.md §2).
   */
  get favoriteIcon() {
    return surfaceLocator("Favorite icon image")
      .desktop((p) => p.getByRole("button", { name: "Favorite" }).locator("img"))
      .build(this.page, this.surface);
  }

  // --- Seller Information ---

  get sellerInfoHeading() {
    return surfaceLocator("Seller Information heading")
      .desktop((p) => p.getByText("Seller Information", { exact: true }))
      .build(this.page, this.surface);
  }

  /** Confirmed live: `span.font-medium.truncate` holds the seller's display name (e.g. "Sellvell"). */
  get sellerName() {
    return surfaceLocator("Seller name")
      .desktop((p) => p.locator("span.font-medium.truncate").first())
      .build(this.page, this.surface);
  }

  get verifiedSellerBadge() {
    return surfaceLocator("Verified Seller badge")
      .desktop((p) => p.getByText("Verified Seller", { exact: true }))
      .build(this.page, this.surface);
  }

  /**
   * Confirmed live: for an anonymous visitor, Phone Number and Store URL are
   * never rendered — replaced by this "Login to view the seller's details."
   * control instead (see requirements doc §4).
   */
  get loginToViewSellerDetailsLink() {
    return surfaceLocator("Login to view seller details link")
      .desktop((p) => p.getByText(/to view the seller.s details\.?/i))
      .build(this.page, this.surface);
  }

  /**
   * Confirmed live: two nested divs match "Business Experience" text — the
   * outer container (`.first()`) holds the full concatenated label+value
   * text (e.g. "Business Experience-"), the inner one holds only the label.
   * Read the outer div's full text and strip the label in the Actions layer.
   */
  get businessExperienceField() {
    return surfaceLocator("Business Experience field")
      .desktop((p) => p.locator("div", { hasText: /^Business Experience/ }).first())
      .build(this.page, this.surface);
  }

  // --- Quick links / Add-on services (same 4 names in two different sections) ---

  /** The compact quick-link card — confirmed live: the whole card is a real `<a target="_blank">`. */
  quickLinkCard(name: string) {
    return surfaceLocator(`Quick link card: ${name}`)
      .asButton()
      .desktop((p) =>
        p.locator('a[target="_blank"]', {
          has: p.locator("h3", { hasText: exactTextPattern(name) }),
        }),
      )
      .build(this.page, this.surface);
  }

  /** The full Add-On Services card's CTA — confirmed live: a `<section>` ancestor distinct from the quick-link card's `<a>` wrapper. */
  addOnServiceCta(name: string) {
    return surfaceLocator(`Add-on service CTA: ${name}`)
      .asButton()
      .desktop((p) =>
        p
          .locator("section", { has: p.locator("h3", { hasText: exactTextPattern(name) }) })
          .locator("a")
          .first(),
      )
      .build(this.page, this.surface);
  }

  get equipmentDetailsHeading() {
    return surfaceLocator("Equipment Details heading")
      .desktop((p) => p.getByRole("heading", { level: 2, name: "Equipment Details", exact: true }))
      .build(this.page, this.surface);
  }

  get featuresHeading() {
    return surfaceLocator("Features and Specifications heading")
      .desktop((p) =>
        p.getByRole("heading", { level: 2, name: "Features and Specifications", exact: true }),
      )
      .build(this.page, this.surface);
  }
}
