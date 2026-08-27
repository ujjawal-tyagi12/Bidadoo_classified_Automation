import type { Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import { SubmitConfirmationPage } from "../pages/SubmitConfirmationPage.js";
import { WaitHelper } from "@core/ui/wait/index.js";

export class SubmissionActions {
  private readonly confirmation: SubmitConfirmationPage;
  private readonly wait: WaitHelper;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.confirmation = new SubmitConfirmationPage(page, deps.uiSurface);
    this.wait = new WaitHelper(page);
  }

  async assertConfirmationDialogVisible(): Promise<void> {
    await this.confirmation.message.expect.toBeVisible();
    await this.confirmation.cancelButton.expect.toBeVisible();
    await this.confirmation.okButton.expect.toBeVisible();
  }

  async cancelSubmission(): Promise<void> {
    await this.confirmation.cancelButton.click();
  }

  async assertConfirmationDialogClosed(): Promise<void> {
    await this.confirmation.message.expect.toBeHidden();
  }

  /**
   * Clicking Ok posts to the same persistence endpoint documented in
   * docs/requirements §2a — previously observed returning a 400 on every
   * attempt, now confirmed working again (re-verified live, including the
   * listing actually appearing in Listings afterward). See §2a for the
   * full history; TC15/TC42 assert the end state via
   * SellerDashboardActions.assertListingVisible() after this call redirects
   * to the Listings tab.
   *
   * The redirect itself can take well over the default action timeout for
   * a heavy submission (confirmed live: a 50-image listing kept the dialog
   * on "Submitting…" past 15s) — waits for real navigation away from the
   * create-equipment page with a generous timeout instead of trusting the
   * click alone, so callers with a large media payload don't need their own
   * workaround. Checks navigation *away* from `create-equipment` rather than
   * arrival at `/dashboard`, because the create-equipment URL itself
   * (`/dashboard/create-equipment?...`) already contains "/dashboard" as a
   * substring — confirmed live that a naive `includes("/dashboard")` check
   * resolves immediately without ever waiting for the real redirect.
   */
  async confirmSubmission(): Promise<void> {
    await this.confirmation.okButton.click();
    await this.wait.waitForCondition(async () => !this.page.url().includes("create-equipment"), {
      timeout: 90000,
    });
  }
}
