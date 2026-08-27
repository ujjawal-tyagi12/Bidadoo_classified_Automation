import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Custom Attributes list, create/edit form, and detail view (BIDC-474/475).
 * Create and Edit share the same route/shell (`/dashboard/custom-attributes/new`,
 * with `?edit=1&id=` for edit) — confirmed live, see
 * docs/requirements/custom-attributes-automation-requirements.md.
 */
export class CustomAttributesPage extends BasePage {
  // --- List page ---

  get newAttributeButton() {
    return surfaceLocator("New Custom Attribute button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /new custom attribute/i }))
      .build(this.page, this.surface);
  }

  get table() {
    return surfaceLocator("Custom Attributes table")
      .desktop((p) => p.getByRole("table"))
      .build(this.page, this.surface);
  }

  get paginationSummary() {
    return surfaceLocator("Pagination summary")
      .desktop((p) => p.getByText(/^Showing /))
      .build(this.page, this.surface);
  }

  /** The only `<select>` on this page — same convention as ListingsPage. */
  get rowsPerPageDropdown() {
    return surfaceLocator("Rows per page dropdown")
      .asDropdown()
      .desktop((p) => p.getByRole("combobox"))
      .build(this.page, this.surface);
  }

  /** `.first()` so repeated runs that accumulate same-named attributes never hit a strict-mode ambiguity. */
  private rowByName(name: string) {
    return this.page.locator("table tbody tr", { hasText: name }).first();
  }

  attributeIdLink(name: string) {
    return surfaceLocator(`Attribute ID link: ${name}`)
      .asButton()
      .desktop(() => this.rowByName(name).getByRole("link"))
      .build(this.page, this.surface);
  }

  rowStatusCell(name: string) {
    return surfaceLocator(`Row status: ${name}`)
      .desktop(() => this.rowByName(name).locator("td").nth(3))
      .build(this.page, this.surface);
  }

  rowMoreButton(name: string) {
    return surfaceLocator(`Row More button: ${name}`)
      .asButton()
      .desktop(() => this.rowByName(name).getByRole("button").last())
      .build(this.page, this.surface);
  }

  rowMoreMenu(name: string) {
    return surfaceLocator(`Row More menu: ${name}`)
      .desktop(() => this.rowByName(name).getByRole("menu"))
      .build(this.page, this.surface);
  }

  rowMoreMenuItem(name: string, label: string) {
    return surfaceLocator(`Row More menu item: ${name} → ${label}`)
      .asButton()
      .desktop(() => this.rowByName(name).getByRole("menu").getByRole("button", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  // --- Create / Edit form ---

  get nameInput() {
    return surfaceLocator("Attribute Name input")
      .asTextInput()
      .desktop((p) => p.locator("#attributeName"))
      .build(this.page, this.surface);
  }

  /**
   * Confirmed live: `getByRole("alert")` alone also matches Next.js's own hidden
   * `#__next-route-announcer__` div (present on every page, unrelated to this
   * form) — scoping to `<p role="alert">` specifically excludes it.
   */
  get nameAlert() {
    return surfaceLocator("Attribute Name alert")
      .desktop((p) => p.locator("p[role='alert']"))
      .build(this.page, this.surface);
  }

  /**
   * A `div[role='button']`, not a real `<button>` — same pattern confirmed on Listings'
   * Status filter dropdown. Targeted structurally (the "Attribute type" label's next
   * sibling) since its accessible name changes once a type is selected.
   */
  get typeDropdown() {
    return surfaceLocator("Attribute type dropdown")
      .asButton()
      .desktop((p) =>
        p.locator("label", { hasText: "Attribute type" }).locator("xpath=following-sibling::div[1]//*[@role='button']"),
      )
      .build(this.page, this.surface);
  }

  typeOption(label: string) {
    return surfaceLocator(`Attribute type option: ${label}`)
      .asButton()
      .desktop((p) => p.getByRole("option", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  /** `index` is 1-based, matching the real "Value 1", "Value 2", ... labels. */
  valueInput(index: number) {
    return surfaceLocator(`Value ${index} input`)
      .asTextInput()
      .desktop((p) => p.getByPlaceholder(`Enter Value ${index}`))
      .build(this.page, this.surface);
  }

  get addMoreValueButton() {
    return surfaceLocator("Add More value button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /add more/i }))
      .build(this.page, this.surface);
  }

  get formCancelButton() {
    return surfaceLocator("Form Cancel button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Cancel", exact: true }))
      .build(this.page, this.surface);
  }

  /** Reads "Create Custom Attribute" on create, "Save Changes" on edit — matched by regex to cover both. */
  get formSubmitButton() {
    return surfaceLocator("Form submit button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /create custom attribute|save changes/i }))
      .build(this.page, this.surface);
  }

  // --- Detail / View page ---

  get detailHeading() {
    return surfaceLocator("Custom Attribute detail heading")
      .desktop((p) => p.getByRole("heading", { name: "Custom Attribute", exact: true }))
      .build(this.page, this.surface);
  }

  /** Detail page renders each field as a label `<div>` immediately followed by a value `<div>` sibling — confirmed live. */
  private detailField(label: string) {
    return this.page.getByText(label, { exact: true }).locator("xpath=following-sibling::div[1]");
  }

  get detailAttributeName() {
    return surfaceLocator("Detail: Attribute Name value")
      .desktop(() => this.detailField("Attribute Name"))
      .build(this.page, this.surface);
  }

  get detailAttributeType() {
    return surfaceLocator("Detail: Attribute Type value")
      .desktop(() => this.detailField("Attribute Type"))
      .build(this.page, this.surface);
  }

  get detailStatus() {
    return surfaceLocator("Detail: Status value")
      .desktop(() => this.detailField("Status"))
      .build(this.page, this.surface);
  }

  /** Reads "Deactivate" when Active, "Activate" when Deactivated — matched by regex to cover both. */
  get detailStatusToggleButton() {
    return surfaceLocator("Detail: Activate/Deactivate button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /^(De)?[Aa]ctivate$/ }))
      .build(this.page, this.surface);
  }

  get detailEditButton() {
    return surfaceLocator("Detail: Edit button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Edit", exact: true }))
      .build(this.page, this.surface);
  }

  get statusConfirmDialog() {
    return surfaceLocator("Activate/Deactivate confirmation dialog")
      .desktop((p) => p.getByRole("dialog"))
      .build(this.page, this.surface);
  }

  statusConfirmDialogButton(label: string) {
    return surfaceLocator(`Confirmation dialog button: ${label}`)
      .asButton()
      .desktop((p) => p.getByRole("dialog").getByRole("button", { name: label, exact: true }))
      .build(this.page, this.surface);
  }
}
