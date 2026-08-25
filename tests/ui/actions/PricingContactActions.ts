import type { Page } from "@playwright/test";
import type { PricingContactProps } from "@data/props/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { PricingContactPage } from "../pages/PricingContactPage.js";

export class PricingContactActions {
  private readonly pricingContact: PricingContactPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.pricingContact = new PricingContactPage(page, deps.uiSurface);
  }

  async fillPricingContact(props: PricingContactProps): Promise<void> {
    await this.pricingContact.priceInput.fill(props.price);
    await this.pricingContact.currencyDropdown.selectOption(props.currency);
    await this.pricingContact.contactNameInput.fill(props.contactName);
    await this.pricingContact.contactPhoneInput.fill(props.contactPhone);
    await this.pricingContact.contactEmailInput.fill(props.contactEmail);
  }

  async useCompanyContactDetails(): Promise<void> {
    await this.pricingContact.useCompanyContactDetailsToggle.click();
  }

  async assertContactNameDisabled(): Promise<void> {
    await this.pricingContact.contactNameInput.expect.toBeDisabled();
  }
}
