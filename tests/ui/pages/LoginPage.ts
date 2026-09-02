import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

export class LoginPage extends BasePage {
  /** Also doubles as a safe, neutral blur target for triggering the password field's on-blur validation. */
  get pageHeading() {
    return surfaceLocator("Login page heading")
      .desktop((p) => p.getByRole("heading", { name: "Welcome Back" }))
      .build(this.page, this.surface);
  }

  get emailInput() {
    return surfaceLocator("Email input")
      .asTextInput()
      .desktop((p) => p.locator("#email"))
      .build(this.page, this.surface);
  }

  get passwordInput() {
    return surfaceLocator("Password input")
      .asTextInput()
      .desktop((p) => p.locator("#password"))
      .build(this.page, this.surface);
  }

  get loginButton() {
    return surfaceLocator("Login button")
      .asButton()
      .desktop((p) => p.locator("button[type='submit']"))
      .build(this.page, this.surface);
  }

  /** Real checkbox input is visually hidden (`sr-only`); the <label> is the real click target — same pattern as Location/Pricing & Contact's checkboxes. */
  get rememberMeCheckbox() {
    return surfaceLocator("Remember Me checkbox")
      .asCheckbox()
      .desktop((p) => p.locator("label", { hasText: "Remember Me" }))
      .build(this.page, this.surface);
  }

  /** Its accessible name toggles between "Show password"/"Hide password" — matching either confirms it's found regardless of current state. */
  get passwordVisibilityToggle() {
    return surfaceLocator("Password visibility toggle")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /show password|hide password/i }))
      .build(this.page, this.surface);
  }

  get forgotPasswordLink() {
    return surfaceLocator("Forgot Password link")
      .asButton()
      .desktop((p) => p.getByRole("link", { name: "Forgot Password?" }))
      .build(this.page, this.surface);
  }

  get emailFormatError() {
    return surfaceLocator("Email format error")
      .desktop((p) => p.getByText("Enter a valid email address", { exact: true }))
      .build(this.page, this.surface);
  }

  get passwordLengthError() {
    return surfaceLocator("Password length error")
      .desktop((p) => p.getByText("Password must be at least 8 characters", { exact: true }))
      .build(this.page, this.surface);
  }

  /** Regex, not exact text: the real message includes a "you have N attempts remaining" count that varies with account history. */
  get incorrectPasswordError() {
    return surfaceLocator("Incorrect password error")
      .desktop((p) => p.getByText(/Sorry, the password is incorrect\./i))
      .build(this.page, this.surface);
  }

  get accountNotFoundError() {
    return surfaceLocator("Account not found error")
      .desktop((p) => p.getByText("This account doesn’t exist. Enter a different email address or Sign Up", { exact: true }))
      .build(this.page, this.surface);
  }

  /** Present on every authenticated page's header, not just Login — housed here since it's the natural pair to logging in. */
  get profileMenuButton() {
    return surfaceLocator("Profile menu button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Profile menu" }))
      .build(this.page, this.surface);
  }

  get logoutMenuItem() {
    return surfaceLocator("Logout menu item")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Logout", exact: false }))
      .build(this.page, this.surface);
  }

  /** The "Confirm Logout" dialog's own Logout button — distinct from the profile menu's "Logout" item that opens it. */
  get confirmLogoutButton() {
    return surfaceLocator("Confirm Logout dialog button")
      .asButton()
      .desktop((p) => p.getByRole("dialog").getByRole("button", { name: "Logout", exact: true }))
      .build(this.page, this.surface);
  }
}
