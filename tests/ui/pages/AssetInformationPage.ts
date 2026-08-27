import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";


export class AssetInformationPage extends BasePage {
  private get formSection() {
    return this.page.locator("div.grid.grid-cols-1.md\\:grid-cols-3").first();
  }

  private get categoryModal() {
    return this.page.locator("div.rounded-2xl", {
      has: this.page.getByRole("heading", { name: "Select Category" }),
    });
  }

  get referenceIdInput() {
    return surfaceLocator("Reference ID input")
      .asTextInput()
      .desktop((p) => p.locator("input[name='referenceId']"))
      .build(this.page, this.surface);
  }

  /** Shown on a failed Save as Draft / Submit when the Reference ID is already in use. */
  get duplicateReferenceIdError() {
    return surfaceLocator("Duplicate Reference ID error")
      .desktop((p) => p.getByText("Reference ID must be alphanumeric and unique."))
      .build(this.page, this.surface);
  }

  get titleInput() {
    return surfaceLocator("Listing Title input")
      .asTextInput()
      .desktop((p) => p.locator("#title"))
      .build(this.page, this.surface);
  }

  get makeInput() {
    return surfaceLocator("Make input")
      .asTextInput()
      .desktop((p) => p.locator("#make"))
      .build(this.page, this.surface);
  }

  makeSuggestion(label: string) {
    return surfaceLocator(`Make suggestion: ${label}`)
      .asButton()
      .desktop((p) => p.getByRole("option", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  get modelInput() {
    return surfaceLocator("Model input")
      .asTextInput()
      .desktop((p) => p.locator("#model"))
      .build(this.page, this.surface);
  }

  modelSuggestion(label: string) {
    return surfaceLocator(`Model suggestion: ${label}`)
      .asButton()
      .desktop((p) => p.getByRole("option", { name: label, exact: true }))
      .build(this.page, this.surface);
  }

  get categoryOpenButton() {
    return surfaceLocator("Select Equipment Category button")
      .asButton()
      .desktop((p) =>
        this.formSection.locator("button", {
          hasText: "Select Equipment Category",
        }),
      )
      .build(this.page, this.surface);
  }

  /**
   * Same control as `categoryOpenButton`, but matched by structure (the label's
   * next sibling) instead of placeholder text — needed once a category has
   * already been selected, since the button then shows the category name
   * instead of "Select Equipment Category" (e.g. read-only View Equipment mode).
   */
  get categoryButton() {
    return surfaceLocator("Category/Type button")
      .asButton()
      .desktop(() =>
        this.formSection
          .locator("label", { hasText: "Category/Type" })
          .locator("xpath=following-sibling::div[1]//button"),
      )
      .build(this.page, this.surface);
  }

  categoryToggle(label: string) {
    return surfaceLocator(`Category tree toggle: ${label}`)
      .asButton()
      .desktop(() =>
        this.categoryModal
          .locator("span", { hasText: exactTextPattern(label) })
          .first()
          .locator(
            "xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-center')][1]",
          )
          .locator("button[aria-label='toggle']"),
      )
      .build(this.page, this.surface);
  }

  categoryLeaf(label: string) {
    return surfaceLocator(`Category tree leaf: ${label}`)
      .asButton()
      .desktop(() =>
        this.categoryModal.locator("button:has(img[alt='check'])", {
          hasText: exactTextPattern(label),
        }),
      )
      .build(this.page, this.surface);
  }

  get categorySubmitButton() {
    return surfaceLocator("Category modal Submit button")
      .asButton()
      .desktop(() => this.categoryModal.getByRole("button", { name: "Submit" }))
      .build(this.page, this.surface);
  }

  get categoryCancelButton() {
    return surfaceLocator("Category modal Cancel button")
      .asButton()
      .desktop(() => this.categoryModal.getByRole("button", { name: "Cancel" }))
      .build(this.page, this.surface);
  }

  get yearInput() {
    return surfaceLocator("Model Year input")
      .asTextInput()
      .desktop((p) => p.locator("#year"))
      .build(this.page, this.surface);
  }

  get serialInput() {
    return surfaceLocator("Serial # input")
      .asTextInput()
      .desktop((p) => p.locator("#serial"))
      .build(this.page, this.surface);
  }

  get usageHoursInput() {
    return surfaceLocator("Usage Hours/Miles input")
      .asTextInput()
      .desktop((p) => p.locator("#usageHr"))
      .build(this.page, this.surface);
  }

  get usageTypeDropdown() {
    return surfaceLocator("Usage Type dropdown")
      .asDropdown()
      .desktop((p) => p.locator("select#usage-type-select"))
      .build(this.page, this.surface);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactTextPattern(value: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`);
}
