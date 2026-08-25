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
    await this.deps.nav.goto("/login?callbackUrl=%2Fdashboard");
    await this.login.emailInput.fill(email);
    await this.login.passwordInput.fill(password);
    await this.login.loginButton.click();
    await this.deps.nav.waitForURL(/\/dashboard/);
  }
}
