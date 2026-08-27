import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * The "Welcome Back" sign-in modal triggered by clicking a favorite icon
 * while signed out — confirmed live as the identical dialog on both the
 * `/search` result cards and the equipment detail page; only the subtitle
 * text differs by trigger surface. See
 * docs/requirements/equipment-favorite-automation-requirements.md §2/§3.
 */
export class LoginModalPage extends BasePage {
  get dialog() {
    return surfaceLocator("Sign-in dialog")
      .desktop((p) => p.getByRole("dialog"))
      .build(this.page, this.surface);
  }

  get subtitle() {
    return surfaceLocator("Sign-in dialog subtitle")
      .desktop((p) => p.getByRole("dialog").locator("h3"))
      .build(this.page, this.surface);
  }

  get emailInput() {
    return surfaceLocator("Sign-in email input")
      .asTextInput()
      .desktop((p) => p.getByRole("dialog").locator("#email"))
      .build(this.page, this.surface);
  }

  get passwordInput() {
    return surfaceLocator("Sign-in password input")
      .asTextInput()
      .desktop((p) => p.getByRole("dialog").locator("#password"))
      .build(this.page, this.surface);
  }

  get signInButton() {
    return surfaceLocator("Sign In button")
      .asButton()
      .desktop((p) => p.getByRole("dialog").getByRole("button", { name: "Sign In", exact: true }))
      .build(this.page, this.surface);
  }

  /** Confirmed live: a real `<a href="/forgot-password">` — a full-page navigation, not an in-modal panel. */
  get forgotPasswordLink() {
    return surfaceLocator("Forgot Password link")
      .asButton()
      .desktop((p) => p.getByRole("dialog").getByRole("link", { name: "Forgot Password?" }))
      .build(this.page, this.surface);
  }

  /** Confirmed live: a real `<a href="/user-type">` — navigates to the Buyer/Seller picker, not an in-modal signup form. */
  get signUpLink() {
    return surfaceLocator("Sign Up link")
      .asButton()
      .desktop((p) => p.getByRole("dialog").getByRole("link", { name: "Sign Up", exact: true }))
      .build(this.page, this.surface);
  }

  /** `#email-error` — real inline field validation confirmed live. */
  get invalidEmailMessage() {
    return surfaceLocator("Invalid email inline message")
      .desktop((p) => p.locator("#email-error"))
      .build(this.page, this.surface);
  }

  /** `#password-error` — real inline field validation confirmed live. */
  get shortPasswordMessage() {
    return surfaceLocator("Short password inline message")
      .desktop((p) => p.locator("#password-error"))
      .build(this.page, this.surface);
  }

  /** Real, exact server message confirmed live (includes a genuine "attempts attempts" copy bug). */
  get incorrectPasswordMessage() {
    return surfaceLocator("Incorrect password server message")
      .desktop((p) => p.getByText(/Sorry, the password is incorrect/i))
      .build(this.page, this.surface);
  }

  /** Real, exact server message confirmed live. */
  get accountNotFoundMessage() {
    return surfaceLocator("Account not found server message")
      .desktop((p) => p.getByText(/This account doesn.t exist/i))
      .build(this.page, this.surface);
  }
}
