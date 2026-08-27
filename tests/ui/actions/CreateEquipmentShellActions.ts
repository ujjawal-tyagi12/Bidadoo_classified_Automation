import type { Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import { CreateEquipmentShellPage } from "../pages/CreateEquipmentShellPage.js";

export type WizardStepName =
  | "Asset Information"
  | "Location"
  | "Pricing & Contact Details"
  | "Description & Details"
  | "Media Upload";

const STEP_ORDER: WizardStepName[] = [
  "Asset Information",
  "Location",
  "Pricing & Contact Details",
  "Description & Details",
  "Media Upload",
];

export class CreateEquipmentShellActions {
  private readonly shell: CreateEquipmentShellPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.shell = new CreateEquipmentShellPage(page, deps.uiSurface);
  }

  /** Deep-links straight to the wizard — avoids the unrelated Listings → New Listing navigation bug (see requirements §2b). */
  async openDirectly(): Promise<void> {
    await this.deps.nav.goto("/dashboard/create-equipment?status=asset-information");
  }

  async clickBack(): Promise<void> {
    await this.shell.backControl.click();
  }

  async assertRedirectedToDashboard(): Promise<void> {
    await this.deps.pageAssert.urlContains("/dashboard");
  }

  /** DOM case differs by entry route (mixed-case vs. literally uppercase) — case-insensitive regexes cover both. */
  async assertBreadcrumb(): Promise<void> {
    await this.shell.breadcrumb.expect.toContainText(/home/i);
    await this.shell.breadcrumb.expect.toContainText(/listings/i);
    await this.shell.breadcrumb.expect.toContainText(/create new listing/i);
  }

  /** Asserts the stepper shows exactly one active step and the rest in their expected state. */
  async assertActiveStep(activeStep: WizardStepName): Promise<void> {
    const activeIndex = STEP_ORDER.indexOf(activeStep);
    for (const [index, stepName] of STEP_ORDER.entries()) {
      const icon = this.shell.stepIndicatorIcon(index + 1, stepName);
      if (index < activeIndex) {
        await icon.expect.toHaveAttribute("src", /circle_tick\.svg/);
      } else if (index === activeIndex) {
        // Next.js image URLs percent-encode the path (".../circle.svg" ->
        // "...%2Fcircle.svg"), so there's never a literal "/" right before
        // the filename — match the filename alone. It can't collide with
        // circle_tick.svg / circle_unselected.svg since neither contains
        // "circle.svg" as a substring (the char after "circle" differs).
        await icon.expect.toHaveAttribute("src", /circle\.svg/);
      } else {
        await icon.expect.toHaveAttribute("src", /circle_unselected\.svg/);
      }
    }
  }

  /**
   * The step icon stays clickable for any already-reached step (bubbles to the
   * parent button), but confirmed live it shares the same click race found
   * throughout this app (see `ListingsActions.filterByStatus`) — the click can
   * register without the step actually changing. Verifying against the target
   * step's own heading (not the icon's tick/circle state, which stays
   * "completed" for an already-valid step even while it's the one showing —
   * confirmed live) and retrying is what makes this reliable.
   */
  async goToStep(stepName: WizardStepName): Promise<void> {
    const index = STEP_ORDER.indexOf(stepName);
    const icon = this.shell.stepIndicatorIcon(index + 1, stepName);
    const heading = this.shell.stepHeading(stepName);
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        await icon.click();
        await heading.expect.toBeVisible({ timeout: isLastAttempt ? 6000 : 1500 });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async saveAsDraft(): Promise<void> {
    await this.shell.saveAsDraftButton.click();
  }

  async clickNext(): Promise<void> {
    await this.shell.nextButton.click();
  }

  async assertNextDisabled(): Promise<void> {
    await this.shell.nextButton.expect.toBeDisabled();
  }

  async assertNextEnabled(): Promise<void> {
    await this.shell.nextButton.expect.toBeEnabled();
  }

  async clickSubmit(): Promise<void> {
    await this.shell.submitButton.click();
  }

  async assertSubmitDisabled(): Promise<void> {
    await this.shell.submitButton.expect.toBeDisabled();
  }

  async assertSubmitEnabled(): Promise<void> {
    await this.shell.submitButton.expect.toBeEnabled();
  }

  async assertViewEquipmentHeadingVisible(): Promise<void> {
    await this.shell.viewEquipmentHeading.expect.toBeVisible();
  }

  async clickEdit(): Promise<void> {
    await this.shell.editButton.click();
  }
}
