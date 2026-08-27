import type { Page } from "@playwright/test";
import { ENV } from "@config/env.js";
import type { ActionDeps } from "../support/action-deps.js";
import { LoginPage } from "../pages/LoginPage.js";

export class LoginActions {
  private readonly login: LoginPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.login = new LoginPage(page, deps.uiSurface);
  }

  async loginAsAdmin(): Promise<void> {
    await this.loginWith(ENV.ADMIN_EMAIL, ENV.ADMIN_PASSWORD);
  }

  async loginWith(email: string, password: string): Promise<void> {
    await this.openLoginPage();
    await this.fillCredentials(email, password);
    await this.submitLogin();
    await this.deps.nav.waitForURL(/\/dashboard/);
  }

  async openLoginPage(): Promise<void> {
    await this.deps.nav.goto("/login?callbackUrl=%2Fdashboard");
  }

  /** Fills both fields, then blurs off the page heading — the real app validates Password on blur, so a fill-only flow wouldn't surface it. */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.login.emailInput.fill(email);
    await this.login.passwordInput.fill(password);
    await this.login.pageHeading.click();
  }

  async submitLogin(): Promise<void> {
    await this.login.loginButton.click();
  }

  /** No redirect assertion — for negative paths where the app stays on the login page with an error. */
  async attemptLoginWith(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submitLogin();
  }

  async toggleRememberMe(): Promise<void> {
    await this.login.rememberMeCheckbox.toggle();
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.login.passwordVisibilityToggle.click();
  }

  async assertLoginButtonDisabled(): Promise<void> {
    await this.login.loginButton.expect.toBeDisabled();
  }

  async assertLoginButtonEnabled(): Promise<void> {
    await this.login.loginButton.expect.toBeEnabled();
  }

  async assertEmailFormatErrorVisible(): Promise<void> {
    await this.login.emailFormatError.expect.toBeVisible();
  }

  async assertPasswordLengthErrorVisible(): Promise<void> {
    await this.login.passwordLengthError.expect.toBeVisible();
  }

  async assertIncorrectPasswordErrorVisible(): Promise<void> {
    await this.login.incorrectPasswordError.expect.toBeVisible();
  }

  async assertAccountNotFoundErrorVisible(): Promise<void> {
    await this.login.accountNotFoundError.expect.toBeVisible();
  }

  async assertPasswordMasked(): Promise<void> {
    await this.login.passwordInput.expect.toHaveAttribute("type", "password");
  }

  async assertPasswordVisible(): Promise<void> {
    await this.login.passwordInput.expect.toHaveAttribute("type", "text");
  }

  async assertRememberMeChecked(): Promise<void> {
    await this.login.rememberMeCheckbox.expect.toBeChecked();
  }

  /** Profile menu → Logout → Confirm Logout dialog → Logout; opens the mobile hamburger first if needed. */
  async logout(): Promise<void> {
    if (!(await this.login.profileMenuButton.isVisible())) {
      await this.login.mobileMenuToggle.click();
    }
    await this.login.profileMenuButton.click();
    await this.login.logoutMenuItem.click();
    await this.login.confirmLogoutButton.click();
    await this.deps.nav.waitForURL(/^https?:\/\/[^/]+\/$/);
  }
}
