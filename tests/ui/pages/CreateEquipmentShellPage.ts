import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Chrome shared by every step of the Create New Listing wizard: breadcrumb,
 * back control, stepper, and the Save as draft / Next / Submit footer.
 */
export class CreateEquipmentShellPage extends BasePage {
  get breadcrumb() {
    return surfaceLocator("Breadcrumb")
      .desktop((p) => p.locator("nav[aria-label='Breadcrumb']"))
      .build(this.page, this.surface);
  }

  get backControl() {
    return surfaceLocator("Go back control")
      .asButton()
      .desktop((p) => p.getByAltText("Go back"))
      .build(this.page, this.surface);
  }

  get saveAsDraftButton() {
    return surfaceLocator("Save as draft button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Save as draft" }))
      .build(this.page, this.surface);
  }

  get nextButton() {
    return surfaceLocator("Next button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Next", exact: true }))
      .build(this.page, this.surface);
  }

  get submitButton() {
    return surfaceLocator("Submit button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Submit", exact: true }))
      .build(this.page, this.surface);
  }

  /**
   * Step indicator circle icon, e.g. stepIndicatorIcon(1, "Asset Information").
   * Targets the inner <img> (not the wrapping button) so its `src` can be read
   * to tell upcoming (circle_unselected.svg) from active (circle.svg) from
   * completed (circle_tick.svg) — clicking the icon still activates the
   * parent button via event bubbling.
   */
  stepIndicatorIcon(stepNumber: number, stepName: string) {
    return surfaceLocator(`Step ${stepNumber} indicator icon: ${stepName}`)
      .desktop((p) =>
        p
          .getByRole("button", { name: `Step ${stepNumber}: ${stepName}` })
          .locator("img"),
      )
      .build(this.page, this.surface);
  }
}
