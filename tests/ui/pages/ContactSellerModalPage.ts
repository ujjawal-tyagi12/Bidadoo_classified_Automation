import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * The "Contact Seller" enquiry form dialog. Confirmed live (see
 * docs/requirements/equipment-detail-automation-requirements.md §2/§4):
 * First Name/Email/Phone are required, Last Name/Message are optional, and
 * Submit starts `disabled` and stays disabled until the required fields are
 * validly filled — there is no submit-then-error flow, the disabled state
 * itself is the validation mechanism. An invalid email additionally shows a
 * real inline "Please enter valid email" message.
 */
export class ContactSellerModalPage extends BasePage {
  get dialog() {
    return surfaceLocator("Contact Seller dialog")
      .desktop((p) => p.getByRole("dialog"))
      .build(this.page, this.surface);
  }

  get firstNameInput() {
    return surfaceLocator("First Name input")
      .asTextInput()
      .desktop((p) => p.locator('input[name="first"]'))
      .build(this.page, this.surface);
  }

  get lastNameInput() {
    return surfaceLocator("Last Name input")
      .asTextInput()
      .desktop((p) => p.locator('input[name="last"]'))
      .build(this.page, this.surface);
  }

  get emailInput() {
    return surfaceLocator("Email Address input")
      .asTextInput()
      .desktop((p) => p.locator('input[name="email"]'))
      .build(this.page, this.surface);
  }

  get phoneInput() {
    return surfaceLocator("Phone Number input")
      .asTextInput()
      .desktop((p) => p.locator('input[name="phone"]'))
      .build(this.page, this.surface);
  }

  get messageInput() {
    return surfaceLocator("Message textarea")
      .asTextInput()
      .desktop((p) => p.locator('textarea[name="message"]'))
      .build(this.page, this.surface);
  }

  /** Confirmed live: label text changes to "Submitting…" mid-request — matched loosely so the locator stays stable across that transition. */
  get submitButton() {
    return surfaceLocator("Submit button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /^Submit/ }))
      .build(this.page, this.surface);
  }

  get cancelButton() {
    return surfaceLocator("Cancel button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Cancel" }))
      .build(this.page, this.surface);
  }

  get invalidEmailMessage() {
    return surfaceLocator("Invalid email inline message")
      .desktop((p) => p.getByText("Please enter valid email"))
      .build(this.page, this.surface);
  }
}
