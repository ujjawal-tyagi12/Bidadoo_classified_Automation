import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

export class LoginPage extends BasePage {
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
}
