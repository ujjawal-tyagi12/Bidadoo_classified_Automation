import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Step 3 of the Create New Listing wizard: Pricing Information + Contact
 * Information. See docs/requirements/create-equipment-automation-requirements.md §3.
 */
export class PricingContactPage extends BasePage {
  get priceInput() {
    return surfaceLocator("Price input")
      .asTextInput()
      .desktop((p) => p.locator("#price"))
      .build(this.page, this.surface);
  }

  get currencyDropdown() {
    return surfaceLocator("Currency dropdown")
      .asDropdown()
      .desktop((p) => p.locator("select[name='currency']"))
      .build(this.page, this.surface);
  }

  /** Real checkbox input is visually hidden (`sr-only`); the <label> is the real click target. */
  get useCompanyContactDetailsToggle() {
    return surfaceLocator("Use Company Contact Details toggle")
      .asButton()
      .desktop((p) => p.locator("label", { hasText: "Use Company Contact Details" }))
      .build(this.page, this.surface);
  }

  get contactNameInput() {
    return surfaceLocator("Contact Name input")
      .asTextInput()
      .desktop((p) => p.locator("#contactName"))
      .build(this.page, this.surface);
  }

  /** Value is digits only — the "+1" country-code prefix shown before the field is static UI, not part of the input. */
  get contactPhoneInput() {
    return surfaceLocator("Contact Phone input")
      .asTextInput()
      .desktop((p) => p.locator("#contactPhone"))
      .build(this.page, this.surface);
  }

  get contactEmailInput() {
    return surfaceLocator("Contact Email input")
      .asTextInput()
      .desktop((p) => p.locator("#contactEmail"))
      .build(this.page, this.surface);
  }
}
