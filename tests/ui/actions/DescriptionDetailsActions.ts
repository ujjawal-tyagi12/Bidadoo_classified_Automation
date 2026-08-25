import { expect, type Page } from "@playwright/test";
import type { DescriptionDetailsProps } from "@data/props/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { DescriptionDetailsPage } from "../pages/DescriptionDetailsPage.js";

export class DescriptionDetailsActions {
  private readonly descriptionDetails: DescriptionDetailsPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.descriptionDetails = new DescriptionDetailsPage(page, deps.uiSurface);
  }

  async fillDescriptionDetails(props: DescriptionDetailsProps): Promise<void> {
    await this.descriptionDetails.descriptionEditor.fill(props.description);
    if (props.features) {
      await this.descriptionDetails.featuresEditor.fill(props.features);
    }
    if (props.specifications) {
      await this.descriptionDetails.specificationsEditor.fill(props.specifications);
    }
  }

  /** Types text, selects it all, and applies Bold via the Quill toolbar — proves rich-text formatting actually works, not just that the field accepts plain text. */
  async applyBoldToDescription(text: string): Promise<void> {
    await this.descriptionDetails.descriptionEditor.fill(text);
    await this.descriptionDetails.descriptionEditor.press("ControlOrMeta+a");
    await this.descriptionDetails.descriptionBoldButton.click();
  }

  async assertDescriptionHasBoldFormatting(): Promise<void> {
    const html = await this.descriptionDetails.descriptionEditor.run(
      "Read description HTML",
      (loc) => loc.innerHTML(),
    );
    expect(html).toContain("<strong>");
  }

  async assertDescriptionMinLengthErrorVisible(): Promise<void> {
    await this.descriptionDetails.descriptionMinLengthError.expect.toBeVisible();
  }
}
