import type { Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import { SubmitConfirmationPage } from "../pages/SubmitConfirmationPage.js";

export class SubmissionActions {
  private readonly confirmation: SubmitConfirmationPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.confirmation = new SubmitConfirmationPage(page, deps.uiSurface);
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
   */
  async confirmSubmission(): Promise<void> {
    await this.confirmation.okButton.click();
  }
}
