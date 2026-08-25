import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Step 4 of the Create New Listing wizard: three Quill rich-text editors
 * (Description*, Features, Specifications). Each editor is a
 * `[contenteditable="true"]` div distinguished by its unique
 * `data-placeholder` — verified live that `.fill()`/`.clear()` work
 * directly on them despite not being real <input>/<textarea> elements, so
 * they use the standard `.asTextInput()` element like any other text field.
 * Only Description carries a required marker; Next stays enabled with
 * Features/Specifications left empty.
 */
export class DescriptionDetailsPage extends BasePage {
  get descriptionEditor() {
    return surfaceLocator("Description editor")
      .asTextInput()
      .desktop((p) =>
        p.locator(
          "[contenteditable='true'][data-placeholder='A detailed description to help buyers understand your equipment better']",
        ),
      )
      .build(this.page, this.surface);
  }

  get featuresEditor() {
    return surfaceLocator("Features editor")
      .asTextInput()
      .desktop((p) =>
        p.locator("[contenteditable='true'][data-placeholder='Enter key features of the equipment']"),
      )
      .build(this.page, this.surface);
  }

  get specificationsEditor() {
    return surfaceLocator("Specifications editor")
      .asTextInput()
      .desktop((p) =>
        p.locator(
          "[contenteditable='true'][data-placeholder='Enter key specifications such as power, capacity, and dimensions (e.g. 5kW, 2 Tons, 200x150x120 cm)']",
        ),
      )
      .build(this.page, this.surface);
  }

  /** Description's own toolbar is the first `.ql-toolbar` (editors render in Description/Features/Specifications order). */
  get descriptionBoldButton() {
    return surfaceLocator("Description editor Bold button")
      .asButton()
      .desktop((p) => p.locator(".ql-toolbar button.ql-bold").first())
      .build(this.page, this.surface);
  }

  /** Description enforces a real 20-character minimum (no maximum) — this is the inline error shown below it. */
  get descriptionMinLengthError() {
    return surfaceLocator("Description minimum length error")
      .desktop((p) => p.getByText("Please enter at least 20 characters.", { exact: true }))
      .build(this.page, this.surface);
  }
}
