import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * The confirmation dialog triggered by the final step's Submit button.
 * Exact copy verified live: "By submitting this form, the listing will be
 * published live on the website" with Cancel / Ok buttons. Not a native
 * `role="dialog"` — just a styled overlay div, so elements are targeted by
 * their own text/role rather than a dialog container.
 */
export class SubmitConfirmationPage extends BasePage {
  get message() {
    return surfaceLocator("Submit confirmation message")
      .desktop((p) => p.getByText("By submitting this form, the listing will be published live on the website"))
      .build(this.page, this.surface);
  }

  get cancelButton() {
    return surfaceLocator("Submit confirmation Cancel button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Cancel", exact: true }))
      .build(this.page, this.surface);
  }

  get okButton() {
    return surfaceLocator("Submit confirmation Ok button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Ok", exact: true }))
      .build(this.page, this.surface);
  }
}
