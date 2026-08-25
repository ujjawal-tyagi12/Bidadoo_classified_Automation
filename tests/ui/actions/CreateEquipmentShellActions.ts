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

  /**
   * Deep-links straight to the wizard (a bookmarked link, a page refresh while
   * on it) — deliberately independent of the Listings tab → New Listing click
   * path, which has a separate, unrelated navigation bug (see docs/requirements
   * §2b). Scenarios that verify in-wizard behavior (back button, form entry)
   * use this so they test their own subject, not that bug.
   */
  async openDirectly(): Promise<void> {
    await this.deps.nav.goto("/dashboard/create-equipment?status=asset-information");
  }

  async clickBack(): Promise<void> {
    await this.shell.backControl.click();
  }

  async assertRedirectedToDashboard(): Promise<void> {
    await this.deps.pageAssert.urlContains("/dashboard");
  }

  /**
   * The breadcrumb always reads "HOME | LISTINGS | CREATE NEW LISTING"
   * visually, but the raw DOM text differs by entry route: reached via
   * `openDirectly()` (a hard page load) it's mixed case ("Home | Listings |
   * ..."), CSS-uppercased; reached via Listings tab → New Listing (a
   * client-side navigation) it's literally uppercase in the DOM — confirmed
   * live, see docs/requirements §2b/§11. Case-insensitive regexes make this
   * assertion correct for either route instead of assuming one.
   */
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
}
